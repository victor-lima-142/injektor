import { generateRequestId } from "../runtime/uuid";
import type { Constructor, Provider, LifeCycleOpt } from "../types";
import { metadataRegistry } from "./metadata-registry";
import { getServiceScope } from "../decorators/service";
import { getProcessorScope } from "../decorators/processor";

/**
 * Interface para rastrear tentativas de resolução pendentes
 */
interface PendingResolution {
    token: Constructor | string | symbol;
    attempts: number;
    lastError: Error;
    dependencies: Constructor[];
}

/**
 * Container de Injeção de Dependências
 * Gerencia o ciclo de vida e resolução de dependências dos componentes da aplicação
 *
 * Suporta três escopos de ciclo de vida:
 * - singleton: Uma única instância compartilhada
 * - transient: Nova instância a cada resolução
 * - request: Uma instância por requisição HTTP
 *
 * @example
 * ```typescript
 * const container = new Container();
 * container.register(MyService, { useClass: MyService, scope: 'singleton' });
 * const instance = container.resolve(MyService);
 * ```
 */
export class Container {
    /** Mapa de provedores registrados no container */
    private providers = new Map<Constructor | string | symbol, Provider>();

    /** Cache de instâncias singleton */
    private singletons = new Map<Constructor | string | symbol, any>();

    /** Cache de instâncias por requisição (request-scoped) */
    private requestInstances = new Map<
        string,
        Map<Constructor | string | symbol, any>
    >();

    /** Mapa de resoluções pendentes para evitar loops infinitos */
    private pendingResolutions = new Map<
        Constructor | string | symbol,
        PendingResolution
    >();

    /** Stack de resolução atual para detectar dependências circulares */
    private resolutionStack = new Set<Constructor | string | symbol>();

    /** Flag para habilitar resolução atrasada */
    private enableDeferredResolution = true;

    /**
     * Registra um provedor no container
     * @param token - Token que identifica o provedor (classe, string ou symbol)
     * @param provider - Configuração do provedor
     * @template T - Tipo da instância que será provida
     *
     * @example
     * ```typescript
     * container.register(MyService, { useClass: MyService, scope: 'singleton' });
     * container.register('API_KEY', { useValue: 'secret-key' });
     * container.register(LoggerService, { useFactory: () => new LoggerService() });
     * ```
     */
    register<T>(
        token: Constructor<T> | string | symbol,
        provider: Provider<T>
    ): void {
        this.providers.set(token, provider);

        // Se havia uma resolução pendente, tentar resolver novamente
        if (this.pendingResolutions.has(token)) {
            this.pendingResolutions.delete(token);
            console.log(
                `[INFO] [CONTAINER] Resolvendo dependência anteriormente pendente: ${this.getTokenName(
                    token
                )}`
            );
        }
    }

    /**
     * Resolve uma dependência do container
     * @param token - Token que identifica a dependência
     * @param requestId - ID da requisição (usado para escopo request)
     * @returns Instância da dependência
     * @template T - Tipo da instância esperada
     * @throws {Error} Quando o provedor não é encontrado ou está mal configurado
     *
     * @example
     * ```typescript
     * const myService = container.resolve(MyService);
     * const apiKey = container.resolve<string>('API_KEY');
     * ```
     */
    resolve<T>(token: Constructor<T> | string | symbol, requestId?: string): T {
        // Detectar dependência circular
        if (this.resolutionStack.has(token)) {
            const stackArray = Array.from(this.resolutionStack);
            const tokenName = this.getTokenName(token);
            throw new Error(
                `Dependência circular detectada: ${stackArray
                    .map((t) => this.getTokenName(t))
                    .join(" -> ")} -> ${tokenName}`
            );
        }

        try {
            this.resolutionStack.add(token);
            return this.resolveInternal(token, requestId);
        } catch (error) {
            // Se é um erro de inicialização e a resolução diferida está habilitada
            if (
                this.enableDeferredResolution &&
                this.isInitializationError(error)
            ) {
                return this.handleDeferredResolution(
                    token,
                    requestId,
                    error as Error
                );
            }
            throw error;
        } finally {
            this.resolutionStack.delete(token);
        }
    }

    /**
     * Método interno de resolução sem tratamento de erros especiais
     * @private
     */
    private resolveInternal<T>(
        token: Constructor<T> | string | symbol,
        requestId?: string
    ): T {
        const provider = this.providers.get(token);

        if (!provider) {
            // Tentar auto-registro baseado em decorators antes de lançar erro
            if (typeof token === "function") {
                const autoRegistered = this.tryAutoRegister(token);
                if (autoRegistered) {
                    // Tentar resolver novamente após auto-registro
                    return this.resolveInternal(token, requestId);
                }
            }

            // Criar erro descritivo quando não conseguir resolver
            const tokenName = this.getTokenName(token);
            const errorDetails = this.generateDependencyErrorDetails(token);
            throw new Error(
                `Não foi possível resolver a dependência: ${tokenName}\n\n` +
                    `Possíveis soluções:\n` +
                    `1. Registre a dependência manualmente no container:\n` +
                    `   container.register(${tokenName}, { useClass: ${tokenName}, scope: 'singleton' })\n\n` +
                    `2. Para classes, adicione um decorator apropriado:\n` +
                    `   @Service() // para serviços de negócio\n` +
                    `   @Controller() // para controladores HTTP\n` +
                    `   @Processor() // para processadores\n` +
                    `   @Configuration // para configurações\n\n` +
                    `3. Execute o scanner para registrar automaticamente os componentes:\n` +
                    `   await scanAndRegister()\n\n` +
                    `Detalhes:\n${errorDetails}`
            );
        }

        if ("useValue" in provider) return provider.useValue!;

        if ("useFactory" in provider) {
            const instance = provider.useFactory!();
            return instance;
        }

        if (!provider.useClass) {
            throw new Error(
                `Provider for token ${String(
                    token
                )} does not specify a class or factory.`
            );
        }

        const target = provider.useClass!;
        const scope: LifeCycleOpt = provider.scope ?? "singleton";

        // Gerenciar diferentes escopos
        switch (scope) {
            case "singleton":
                return this.resolveSingleton(token, target);

            case "transient":
                return this.resolveTransient(target, requestId);

            case "request":
                return this.resolveRequest(
                    token,
                    target,
                    requestId ?? generateRequestId()
                );

            default:
                throw new Error(`Unsupported scope: ${scope}`);
        }
    }

    /**
     * Lida com resolução diferida para casos de inicialização tardia
     * @private
     */
    private handleDeferredResolution<T>(
        token: Constructor<T> | string | symbol,
        requestId: string | undefined,
        error: Error
    ): T {
        const tokenName = this.getTokenName(token);

        // Verificar se já tentamos resolver esta dependência muitas vezes
        const pending = this.pendingResolutions.get(token);
        if (pending && pending.attempts >= 3) {
            console.error(
                `[ERROR] [CONTAINER] Falha após 3 tentativas de resolver ${tokenName}:`,
                pending.lastError
            );
            throw new Error(
                `Não foi possível resolver ${tokenName} após múltiplas tentativas.\n` +
                    `Erro original: ${pending.lastError.message}\n\n` +
                    `Isso geralmente indica:\n` +
                    `1. Dependência circular não detectada\n` +
                    `2. Classe não está sendo exportada corretamente\n` +
                    `3. Problema na ordem de importação dos módulos\n\n` +
                    `Soluções:\n` +
                    `- Verifique se todas as classes estão sendo exportadas\n` +
                    `- Considere usar injeção de dependência baseada em tokens/strings\n` +
                    `- Reorganize a ordem das declarações de classe no arquivo`
            );
        }

        // Registrar tentativa pendente
        const dependencies = this.extractDependencies(token);
        this.pendingResolutions.set(token, {
            token,
            attempts: (pending?.attempts ?? 0) + 1,
            lastError: error,
            dependencies,
        });

        console.warn(
            `⏳ Resolução diferida para ${tokenName} (tentativa ${
                (pending?.attempts ?? 0) + 1
            }/3)`
        );

        // Tentar resolver novamente após um pequeno delay
        return new Promise<T>((resolve, reject) => {
            setTimeout(() => {
                try {
                    const result = this.resolveInternal(token, requestId);
                    this.pendingResolutions.delete(token);
                    resolve(result);
                } catch (retryError) {
                    if (pending && pending.attempts >= 2) {
                        reject(retryError);
                    } else {
                        // Tentar mais uma vez
                        setTimeout(() => {
                            try {
                                const finalResult = this.resolveInternal(
                                    token,
                                    requestId
                                );
                                this.pendingResolutions.delete(token);
                                resolve(finalResult);
                            } catch (finalError) {
                                reject(finalError);
                            }
                        }, 100);
                    }
                }
            }, 50);
        }) as any; // Type assertion necessária para compatibilidade
    }

    /**
     * Extrai as dependências de uma classe através de reflection
     * @private
     */
    private extractDependencies(
        token: Constructor | string | symbol
    ): Constructor[] {
        if (typeof token !== "function") return [];

        try {
            return Reflect.getMetadata("design:paramtypes", token) ?? [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Verifica se um erro é relacionado à inicialização de classes
     * @private
     */
    private isInitializationError(error: any): boolean {
        const message = error?.message || "";
        return (
            message.includes("before initialization") ||
            message.includes("is not defined") ||
            message.includes("Cannot access") ||
            message.includes("ReferenceError")
        );
    }

    /**
     * Obtém o nome de um token para logs e mensagens de erro
     * @private
     */
    private getTokenName(token: Constructor | string | symbol): string {
        if (typeof token === "function") return token.name;
        return String(token);
    }

    /**
     * Resolve uma instância singleton (cached)
     * @param token - Token que identifica a dependência
     * @param target - Classe a ser instanciada
     * @returns Instância singleton
     * @template T - Tipo da instância
     * @private
     */
    private resolveSingleton<T>(
        token: Constructor<T> | string | symbol,
        target: Constructor<T>
    ): T {
        if (this.singletons.has(token)) {
            return this.singletons.get(token);
        }

        const instance = this.createInstance(target);
        this.singletons.set(token, instance);
        return instance;
    }

    /**
     * Resolve uma instância transient (sempre nova)
     * @param target - Classe a ser instanciada
     * @param requestId - ID da requisição (para injeção de dependências)
     * @returns Nova instância
     * @template T - Tipo da instância
     * @private
     */
    private resolveTransient<T>(target: Constructor<T>, requestId?: string): T {
        return this.createInstance(target, requestId);
    }

    /**
     * Resolve uma instância request-scoped (uma por requisição)
     * @param token - Token que identifica a dependência
     * @param target - Classe a ser instanciada
     * @param requestId - ID da requisição
     * @returns Instância request-scoped
     * @template T - Tipo da instância
     * @private
     */
    private resolveRequest<T>(
        token: Constructor<T> | string | symbol,
        target: Constructor<T>,
        requestId: string
    ): T {
        // Obter ou criar o mapa de instâncias para esta requisição
        let requestMap = this.requestInstances.get(requestId);
        if (!requestMap) {
            requestMap = new Map();
            this.requestInstances.set(requestId, requestMap);
        }

        // Verificar se já existe uma instância para este token nesta requisição
        if (requestMap.has(token)) {
            return requestMap.get(token);
        }

        // Criar nova instância e armazenar no escopo da requisição
        const instance = this.createInstance(target, requestId);
        requestMap.set(token, instance);
        return instance;
    }

    /**
     * Cria uma nova instância da classe, resolvendo suas dependências
     * @param target - Classe a ser instanciada
     * @param requestId - ID da requisição (usado para resolver dependências)
     * @returns Nova instância com dependências injetadas
     * @template T - Tipo da instância
     * @private
     */
    private createInstance<T>(target: Constructor<T>, requestId?: string): T {
        const deps: any[] =
            Reflect.getMetadata("design:paramtypes", target) ?? [];
        const resolvedDeps = deps.map((dep) => this.resolve(dep, requestId));
        return new target(...resolvedDeps);
    }

    /**
     * Limpa as instâncias de uma requisição específica
     * Deve ser chamado no final de cada requisição HTTP para liberar memória
     * @param requestId - ID da requisição a ser limpa
     *
     * @example
     * ```typescript
     * // No final da requisição HTTP
     * container.clearRequestInstances(requestId);
     * ```
     */
    clearRequestInstances(requestId: string): void {
        this.requestInstances.delete(requestId);
    }

    /**
     * Obtém estatísticas do container
     * @returns Objeto com estatísticas de uso do container
     *
     * @example
     * ```typescript
     * const stats = container.getStats();
     * console.log(`Providers: ${stats.providers}, Singletons: ${stats.singletons}`);
     * ```
     */
    getStats() {
        return {
            /** Número de provedores registrados */
            providers: this.providers.size,
            /** Número de instâncias singleton em cache */
            singletons: this.singletons.size,
            /** Número de requisições ativas com instâncias em cache */
            activeRequests: this.requestInstances.size,
            /** Número de resoluções pendentes */
            pendingResolutions: this.pendingResolutions.size,
        };
    }

    /**
     * Obtém informações detalhadas sobre resoluções pendentes
     * Útil para debugging de problemas de inicialização
     *
     * @returns Array com informações das resoluções pendentes
     *
     * @example
     * ```typescript
     * const pending = container.getPendingResolutions();
     * console.log('Dependências pendentes:', pending);
     * ```
     */
    getPendingResolutions() {
        return Array.from(this.pendingResolutions.values()).map((pending) => ({
            token: this.getTokenName(pending.token),
            attempts: pending.attempts,
            lastError: pending.lastError.message,
            dependencies: pending.dependencies.map((dep) =>
                this.getTokenName(dep)
            ),
        }));
    }

    /**
     * Força a resolução de todas as dependências pendentes
     * Use com cuidado - pode causar erros se as dependências realmente não estiverem prontas
     *
     * @returns Promise que resolve quando todas as tentativas foram feitas
     *
     * @example
     * ```typescript
     * await container.resolvePendingDependencies();
     * console.log('Todas as dependências pendentes foram processadas');
     * ```
     */
    async resolvePendingDependencies(): Promise<void> {
        const pendingTokens = Array.from(this.pendingResolutions.keys());

        if (!!pendingTokens.length) {
            console.log(
                `[INFO] [CONTAINER] Tentando resolver ${pendingTokens.length} dependências pendentes...`
            );
        }
        for (const token of pendingTokens) {
            try {
                console.log(
                    `[DEBUG] [CONTAINER] Resolvendo: ${this.getTokenName(
                        token
                    )}`
                );
                await this.resolve(token);
                console.log(
                    `[INFO] [CONTAINER] Resolvido: ${this.getTokenName(token)}`
                );
            } catch (error) {
                console.warn(
                    `[WARN] [CONTAINER] Ainda não foi possível resolver: ${this.getTokenName(
                        token
                    )}`,
                    error
                );
            }
        }

        if (this.pendingResolutions.size > 0) {
            console.warn(
                `[WARN] [CONTAINER] ${this.pendingResolutions.size} dependências ainda estão pendentes`
            );
        } else {
            if (!!pendingTokens.length) {
                console.log(
                    `[INFO] [CONTAINER] Todas as dependências pendentes foram resolvidas`
                );
            }
        }
    }

    /**
     * Desabilita/habilita a resolução diferida
     * Útil para debugging ou quando você quer falhas imediatas
     *
     * @param enabled - Se true, habilita resolução diferida; se false, desabilita
     *
     * @example
     * ```typescript
     * container.setDeferredResolution(false); // Falhas imediatas
     * container.setDeferredResolution(true);  // Resolução diferida (padrão)
     * ```
     */
    setDeferredResolution(enabled: boolean): void {
        this.enableDeferredResolution = enabled;
        console.log(
            `[INFO] [CONTAINER] Resolução diferida ${
                enabled ? "habilitada" : "desabilitada"
            }`
        );
    }

    /**
     * Reseta o container, limpando todos os provedores e instâncias
     * ⚠️ Use com cuidado! Isso limpa completamente o estado do container
     *
     * @example
     * ```typescript
     * // Em testes ou shutdown da aplicação
     * container.reset();
     * ```
     */
    reset() {
        this.providers.clear();
        this.singletons.clear();
        this.requestInstances.clear();
    }

    /**
     * Tenta registrar automaticamente uma dependência baseado em seus decorators
     * @param token - Token/classe a ser registrada
     * @returns true se conseguiu registrar, false caso contrário
     * @private
     */
    private tryAutoRegister<T>(token: Constructor<T>): boolean {
        try {
            // Verificar se é um serviço
            if (metadataRegistry.services.has(token)) {
                const scope = getServiceScope(token);
                this.register(token, { useClass: token, scope });
                console.log(
                    `[INFO] [REGISTER] Auto-registrado serviço: ${token.name} [${scope}]`
                );
                return true;
            }

            // Verificar se é um controlador
            if (metadataRegistry.controllers.has(token)) {
                const scope: LifeCycleOpt =
                    Reflect.getMetadata("service:scope", token) ?? "singleton";
                this.register(token, { useClass: token, scope });
                console.log(
                    `[INFO] [REGISTER] Auto-registrado controlador: ${token.name} [${scope}]`
                );
                return true;
            }

            // Verificar se é um processador
            if (metadataRegistry.processors.has(token)) {
                const scope = getProcessorScope(token);
                this.register(token, { useClass: token, scope });
                console.log(
                    `[INFO] [REGISTER] Auto-registrado processador: ${token.name} [${scope}]`
                );
                return true;
            }

            // Verificar se é uma configuração
            if (metadataRegistry.configurations.has(token)) {
                this.register(token, { useClass: token, scope: "singleton" });
                console.log(
                    `[INFO] [REGISTER] Auto-registrada configuração: ${token.name} [singleton]`
                );
                return true;
            }

            // Verificar se é a aplicação principal
            if (metadataRegistry.application === token) {
                this.register(token, { useClass: token, scope: "singleton" });
                console.log(
                    `[INFO] [REGISTER] Auto-registrada aplicação: ${token.name} [singleton]`
                );
                return true;
            }

            return false;
        } catch (error) {
            console.warn(
                `[WARN] [REGISTER] Falha ao auto-registrar ${token.name}:`,
                error
            );
            return false;
        }
    }

    /**
     * Gera detalhes descritivos de erro para dependências não encontradas
     * @param token - Token que não foi encontrado
     * @returns String com detalhes do erro
     * @private
     */
    private generateDependencyErrorDetails(
        token: Constructor | string | symbol
    ): string {
        if (typeof token !== "function") {
            return `- Token '${String(token)}' não é uma classe construtora`;
        }

        const details: string[] = [];

        // Verificar se a classe tem decorators conhecidos
        const hasServiceDecorator = metadataRegistry.services.has(token);
        const hasControllerDecorator = metadataRegistry.controllers.has(token);
        const hasProcessorDecorator = metadataRegistry.processors.has(token);
        const hasConfigurationDecorator =
            metadataRegistry.configurations.has(token);
        const isApplication = metadataRegistry.application === token;

        if (hasServiceDecorator) {
            details.push(
                `- Classe ${token.name} tem decorator @Service mas não foi registrada`
            );
        } else if (hasControllerDecorator) {
            details.push(
                `- Classe ${token.name} tem decorator @Controller mas não foi registrada`
            );
        } else if (hasProcessorDecorator) {
            details.push(
                `- Classe ${token.name} tem decorator @Processor mas não foi registrada`
            );
        } else if (hasConfigurationDecorator) {
            details.push(
                `- Classe ${token.name} tem decorator @Configuration mas não foi registrada`
            );
        } else if (isApplication) {
            details.push(
                `- Classe ${token.name} tem decorator @Application mas não foi registrada`
            );
        } else {
            details.push(
                `- Classe ${token.name} não possui decorators reconhecidos (@Service, @Controller, @Processor, @Configuration)`
            );
        }

        // Verificar dependências da classe
        const paramTypes =
            Reflect.getMetadata("design:paramtypes", token) ?? [];
        if (paramTypes.length > 0) {
            details.push(
                `- Classe possui ${paramTypes.length} dependência(s) no construtor:`
            );
            paramTypes.forEach((paramType: any, index: number) => {
                const paramName = paramType?.name || "Unknown";
                const isRegistered = this.providers.has(paramType);
                details.push(
                    `  ${index + 1}. ${paramName} ${
                        isRegistered ? "✅ (registrada)" : "❌ (não registrada)"
                    }`
                );
            });
        } else {
            details.push(`- Classe não possui dependências no construtor`);
        }

        return details.join("\n");
    }
}

/**
 * Instância global do container
 * Conveniência para uso em toda a aplicação
 *
 * @example
 * ```typescript
 * import { GlobalContainer } from './container';
 * GlobalContainer.register(MyService, { useClass: MyService });
 * ```
 */
export const GlobalContainer = new Container();
