import { metadataRegistry } from "../core/metadata-registry";
import type { ProcessorOptions, LifeCycleOpt, LifeCycleConfig } from "../types";

/** Chave para metadados de escopo do processador */
const PROCESSOR_SCOPE_META = "processor:scope";

/** Chave para metadados de configuração do ciclo de vida */
const PROCESSOR_LIFECYCLE_META = "processor:lifecycle";

/**
 * Decorator que marca uma classe como processador
 * Processadores são componentes especiais que executam lógica de processamento
 * específica e são gerenciados pelo container de DI
 * 
 * @param options - Configurações do processador
 * @param options.scope - Escopo do ciclo de vida (singleton, transient, request)
 * @param options.lifecycle - Configuração completa do ciclo de vida
 * @returns Decorator de classe
 * 
 * @example
 * ```typescript
 * @Processor({ scope: 'singleton' })
 * class EmailProcessor {
 *   processEmail(email: Email) {
 *     // Lógica de processamento de email
 *   }
 * }
 * 
 * @Processor({ 
 *   lifecycle: { scope: 'transient' }
 * })
 * class DataProcessor {
 *   processData(data: any) {
 *     // Nova instância para cada processamento
 *   }
 * }
 * ```
 */
export function Processor(options: ProcessorOptions = {}): ClassDecorator {
    return (target) => {
        // Registra o processador no metadata registry
        metadataRegistry.processors.add(target as any);

        // Determinar o escopo (prioriza lifecycle.scope se fornecido)
        const scope: LifeCycleOpt = options.lifecycle?.scope ?? options.scope ?? "singleton";
        
        // Armazenar metadados do escopo
        Reflect.defineMetadata(PROCESSOR_SCOPE_META, scope, target);
        
        // Armazenar configuração completa do ciclo de vida se fornecida
        if (options.lifecycle) {
            Reflect.defineMetadata(PROCESSOR_LIFECYCLE_META, options.lifecycle, target);
        }
    };
}

/**
 * Obtém o escopo do ciclo de vida de um processador
 * @param target - Classe do processador
 * @returns Escopo do ciclo de vida ou "singleton" como padrão
 * 
 * @example
 * ```typescript
 * const scope = getProcessorScope(EmailProcessor);
 * console.log(`EmailProcessor scope: ${scope}`);
 * ```
 */
export function getProcessorScope(target: any): LifeCycleOpt {
    return Reflect.getMetadata(PROCESSOR_SCOPE_META, target) ?? "singleton";
}

/**
 * Obtém a configuração completa do ciclo de vida de um processador
 * @param target - Classe do processador
 * @returns Configuração do ciclo de vida ou undefined se não definida
 * 
 * @example
 * ```typescript
 * const lifecycle = getProcessorLifecycle(EmailProcessor);
 * if (lifecycle) {
 *   console.log(`Lifecycle config: ${lifecycle.scope}`);
 * }
 * ```
 */
export function getProcessorLifecycle(target: any): LifeCycleConfig | undefined {
    return Reflect.getMetadata(PROCESSOR_LIFECYCLE_META, target);
} 