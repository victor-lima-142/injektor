import type { LifeCycleOpt } from "../types";

/**
 * Interface para componentes que implementam hooks de ciclo de vida
 * Permite que componentes sejam notificados sobre eventos de inicialização e destruição
 */
export interface LifeCycleAware {
    /**
     * Chamado quando o componente é inicializado
     * Pode ser usado para configuração inicial, conexão com banco de dados, etc.
     * @returns Promise ou void
     */
    onInit?: () => void | Promise<void>;

    /**
     * Chamado quando o componente está sendo destruído
     * Pode ser usado para limpeza de recursos, fechamento de conexões, etc.
     * @returns Promise ou void
     */
    onDestroy?: () => void | Promise<void>;
}

/**
 * Interface para componentes que implementam hooks específicos de requisição
 * Estende LifeCycleAware com hooks relacionados ao ciclo de vida de requisições HTTP
 */
export interface RequestLifeCycleAware extends LifeCycleAware {
    /**
     * Chamado quando uma nova requisição é iniciada
     * @param requestId - ID único da requisição
     * @returns Promise ou void
     */
    onRequestStart?: (requestId: string) => void | Promise<void>;

    /**
     * Chamado quando uma requisição é finalizada
     * @returns Promise ou void
     */
    onRequestEnd?: () => void | Promise<void>;
}

/**
 * Registry interno para gerenciar instâncias por tipo de ciclo de vida
 * Mantém referências organizadas por escopo para permitir cleanup adequado
 * @private
 */
interface LifeCycleRegistry {
    /** Instâncias singleton registradas para cleanup */
    singleton: Array<{
        instance: LifeCycleAware;
        onDestroy: () => void | Promise<void>;
    }>;

    /** Instâncias transient registradas para cleanup */
    transient: Array<{
        instance: LifeCycleAware;
        onDestroy: () => void | Promise<void>;
    }>;

    /** Instâncias request-scoped organizadas por ID de requisição */
    request: Map<
        string,
        Array<{
            instance: RequestLifeCycleAware;
            onDestroy: () => void | Promise<void>;
            onRequestEnd: () => void | Promise<void>;
        }>
    >;
}

/**
 * Registry global para gerenciar o ciclo de vida de todas as instâncias
 * @private
 */
const lifecycleRegistry: LifeCycleRegistry = {
    singleton: [],
    transient: [],
    request: new Map(),
};

/**
 * Aplica os hooks de ciclo de vida apropriados a uma instância
 * @param instance - Instância do componente
 * @param scope - Escopo do ciclo de vida (singleton, transient, request)
 * @param requestId - ID da requisição (necessário para escopo request)
 *
 * @example
 * ```typescript
 * const myService = new MyService();
 * applyLifecycle(myService, 'singleton');
 * ```
 */
export function applyLifecycle(
    instance: any,
    scope: LifeCycleOpt = "singleton",
    requestId?: string
): void {
    // Executar onInit se existir
    if (typeof instance.onInit === "function") {
        const result = instance.onInit();
        if (result instanceof Promise) {
            result.catch((error) => {
                console.error(
                    `Erro no onInit de ${instance.constructor.name}:`,
                    error
                );
            });
        }
    }

    // Executar onRequestStart para escopo request
    if (
        scope === "request" &&
        requestId &&
        typeof instance.onRequestStart === "function"
    ) {
        const result = instance.onRequestStart(requestId);
        if (result instanceof Promise) {
            result.catch((error) => {
                console.error(
                    `Erro no onRequestStart de ${instance.constructor.name}:`,
                    error
                );
            });
        }
    }

    // Registrar para cleanup se tiver onDestroy
    if (typeof instance.onDestroy === "function") {
        registerForCleanup(instance, scope, requestId);
    }

    // Registrar para cleanup de request se tiver onRequestEnd
    if (
        scope === "request" &&
        requestId &&
        typeof instance.onRequestEnd === "function"
    ) {
        registerForRequestCleanup(instance, requestId);
    }
}

/**
 * Registra uma instância para cleanup automático
 * @param instance - Instância a ser registrada
 * @param scope - Escopo do ciclo de vida
 * @param requestId - ID da requisição (para escopo request)
 * @private
 */
function registerForCleanup(
    instance: LifeCycleAware,
    scope: LifeCycleOpt,
    requestId?: string
): void {
    const cleanupRef = {
        instance,
        onDestroy: instance.onDestroy!.bind(instance),
    };

    switch (scope) {
        case "singleton":
            lifecycleRegistry.singleton.push(cleanupRef);
            break;
        case "transient":
            lifecycleRegistry.transient.push(cleanupRef);
            break;
        case "request":
            if (requestId) {
                const requestInstance = instance as RequestLifeCycleAware;
                const requestCleanupRef = {
                    ...cleanupRef,
                    instance: requestInstance,
                    onRequestEnd:
                        requestInstance.onRequestEnd?.bind(requestInstance) ||
                        (() => {}),
                };

                if (!lifecycleRegistry.request.has(requestId)) {
                    lifecycleRegistry.request.set(requestId, []);
                }
                lifecycleRegistry.request
                    .get(requestId)!
                    .push(requestCleanupRef);
            }
            break;
    }
}

/**
 * Registra uma instância para cleanup específico de requisição
 * @param instance - Instância request-scoped
 * @param requestId - ID da requisição
 * @private
 */
function registerForRequestCleanup(
    instance: RequestLifeCycleAware,
    requestId: string
): void {
    if (!lifecycleRegistry.request.has(requestId)) {
        lifecycleRegistry.request.set(requestId, []);
    }

    const existingRefs = lifecycleRegistry.request.get(requestId)!;
    const existingRef = existingRefs.find((ref) => ref.instance === instance);

    if (existingRef) {
        // Atualizar referência existente
        existingRef.onRequestEnd =
            instance.onRequestEnd?.bind(instance) || (() => {});
    }
}

/**
 * Executa o cleanup de todas as instâncias de uma requisição específica
 * Deve ser chamado no final de cada requisição HTTP
 * @param requestId - ID da requisição a ser limpa
 *
 * @example
 * ```typescript
 * // No middleware de final de requisição
 * app.use((req, res, next) => {
 *   res.on('finish', () => {
 *     cleanupRequest(req.id);
 *   });
 * });
 * ```
 */
export async function cleanupRequest(requestId: string): Promise<void> {
    const requestRefs = lifecycleRegistry.request.get(requestId);
    if (!requestRefs) return;

    console.log(
        `🧹 Limpando ${requestRefs.length} instâncias da requisição ${requestId}`
    );

    for (const ref of requestRefs) {
        try {
            // Executar onRequestEnd primeiro
            if (ref.onRequestEnd) {
                await ref.onRequestEnd();
            }

            // Depois executar onDestroy
            await ref.onDestroy();
        } catch (error) {
            console.error(`Erro no cleanup da requisição ${requestId}:`, error);
        }
    }

    // Remover do registry
    lifecycleRegistry.request.delete(requestId);
}

/**
 * Executa o cleanup de todas as instâncias transient
 * Útil para limpeza periódica ou em situações de baixa memória
 *
 * @example
 * ```typescript
 * // Cleanup periódico
 * setInterval(() => {
 *   cleanupTransient();
 * }, 60000); // A cada minuto
 * ```
 */
export async function cleanupTransient(): Promise<void> {
    console.log(
        `🧹 Limpando ${lifecycleRegistry.transient.length} instâncias transient`
    );

    for (const ref of lifecycleRegistry.transient) {
        try {
            await ref.onDestroy();
        } catch (error) {
            console.error(`Erro no cleanup transient:`, error);
        }
    }

    lifecycleRegistry.transient.length = 0;
}

/**
 * Executa o shutdown completo da aplicação
 * Limpa todas as instâncias em todos os escopos de forma ordenada
 *
 * Ordem de cleanup:
 * 1. Requisições ativas (request-scoped)
 * 2. Instâncias transient
 * 3. Instâncias singleton
 *
 * @example
 * ```typescript
 * // Nos signal handlers da aplicação
 * process.on('SIGTERM', async () => {
 *   await shutdown();
 *   process.exit(0);
 * });
 * ```
 */
export async function shutdown(): Promise<void> {
    console.log("[INFO] [LIFECYCLE] Iniciando shutdown da aplicação...");

    // Limpar todas as requisições ativas
    const activeRequests = Array.from(lifecycleRegistry.request.keys());
    for (const requestId of activeRequests) {
        await cleanupRequest(requestId);
    }

    // Limpar instâncias transient
    await cleanupTransient();

    // Limpar singletons por último
    console.log(
        `🧹 Limpando ${lifecycleRegistry.singleton.length} instâncias singleton`
    );
    for (const ref of lifecycleRegistry.singleton) {
        try {
            await ref.onDestroy();
        } catch (error) {
            console.error(`Erro no cleanup singleton:`, error);
        }
    }

    lifecycleRegistry.singleton.length = 0;
    console.log("✅ Shutdown completo");
}

/**
 * Obtém estatísticas do sistema de ciclo de vida
 * @returns Objeto com estatísticas detalhadas
 *
 * @example
 * ```typescript
 * const stats = getLifecycleStats();
 * console.log(`Active instances: ${stats.requestInstances}`);
 * ```
 */
export function getLifecycleStats() {
    return {
        /** Número de instâncias singleton registradas */
        singletons: lifecycleRegistry.singleton.length,
        /** Número de instâncias transient registradas */
        transients: lifecycleRegistry.transient.length,
        /** Número de requisições ativas */
        activeRequests: lifecycleRegistry.request.size,
        /** Número total de instâncias request-scoped */
        requestInstances: Array.from(
            lifecycleRegistry.request.entries()
        ).reduce((total, [, instances]) => total + instances.length, 0),
    };
}
