import { metadataRegistry } from "../core/metadata-registry";
import type { ServiceOptions, LifeCycleOpt, LifeCycleConfig } from "../types";

/** Chave para metadados de escopo do serviço */
const SERVICE_SCOPE_META = "service:scope";

/** Chave para metadados de configuração do ciclo de vida */
const SERVICE_LIFECYCLE_META = "service:lifecycle";

/**
 * Decorator que marca uma classe como serviço gerenciado pelo container de DI
 * Configura o escopo do ciclo de vida e registra o serviço no sistema
 * 
 * @param options - Configurações do serviço
 * @param options.scope - Escopo do ciclo de vida (singleton, transient, request)
 * @param options.lifecycle - Configuração completa do ciclo de vida
 * @returns Decorator de classe
 * 
 * @example
 * ```typescript
 * @Service({ scope: 'singleton' })
 * class UserService {
 *   getUsers() {
 *     return ['user1', 'user2'];
 *   }
 * }
 * 
 * @Service({ 
 *   lifecycle: { scope: 'request' }
 * })
 * class RequestScopedService {
 *   // Nova instância para cada requisição HTTP
 * }
 * ```
 */
export function Service(options: ServiceOptions = {}): ClassDecorator {
    return (target) => {
        // Registra o serviço no metadata registry
        metadataRegistry.services.add(target as any);

        // Determinar o escopo (prioriza lifecycle.scope se fornecido)
        const scope: LifeCycleOpt = options.lifecycle?.scope ?? options.scope ?? "singleton";
        
        // Armazenar metadados do escopo
        Reflect.defineMetadata(SERVICE_SCOPE_META, scope, target);
        
        // Armazenar configuração completa do ciclo de vida se fornecida
        if (options.lifecycle) {
            Reflect.defineMetadata(SERVICE_LIFECYCLE_META, options.lifecycle, target);
        }
    };
}

/**
 * Obtém o escopo do ciclo de vida de um serviço
 * @param target - Classe do serviço
 * @returns Escopo do ciclo de vida ou "singleton" como padrão
 * 
 * @example
 * ```typescript
 * const scope = getServiceScope(UserService);
 * console.log(`UserService scope: ${scope}`);
 * ```
 */
export function getServiceScope(target: any): LifeCycleOpt {
    return Reflect.getMetadata(SERVICE_SCOPE_META, target) ?? "singleton";
}

/**
 * Obtém a configuração completa do ciclo de vida de um serviço
 * @param target - Classe do serviço
 * @returns Configuração do ciclo de vida ou undefined se não definida
 * 
 * @example
 * ```typescript
 * const lifecycle = getServiceLifecycle(UserService);
 * if (lifecycle) {
 *   console.log(`Lifecycle config: ${lifecycle.scope}`);
 * }
 * ```
 */
export function getServiceLifecycle(target: any): LifeCycleConfig | undefined {
    return Reflect.getMetadata(SERVICE_LIFECYCLE_META, target);
}

/**
 * Decorator de conveniência para serviços com escopo singleton
 * 
 * Este decorator é uma versão simplificada do @Service({ scope: "singleton" }).
 * Cria uma única instância do serviço que é compartilhada em toda a aplicação.
 * 
 * @returns Decorator de classe
 * 
 * @example
 * ```typescript
 * @Singleton
 * class DatabaseService {
 *   private connection: any;
 *   
 *   connect() {
 *     // Uma única conexão compartilhada
 *   }
 * }
 * 
 * // Equivale a:
 * // @Service({ scope: "singleton" })
 * ```
 */
export function Singleton(): ClassDecorator {
    return Service({ scope: "singleton" });
}

/**
 * Decorator de conveniência para serviços com escopo transient
 * 
 * Este decorator é uma versão simplificada do @Service({ scope: "transient" }).
 * Cria uma nova instância do serviço a cada resolução/injeção.
 * 
 * @returns Decorator de classe
 * 
 * @example
 * ```typescript
 * @Transient
 * class LoggerService {
 *   private instanceId = Math.random();
 *   
 *   log(message: string) {
 *     console.log(`[${this.instanceId}] ${message}`);
 *   }
 * }
 * 
 * // Equivale a:
 * // @Service({ scope: "transient" })
 * ```
 */
export function Transient(): ClassDecorator {
    return Service({ scope: "transient" });
}
