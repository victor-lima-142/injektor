import { metadataRegistry } from "../core";
import { ExpressAdapter, FastifyAdapter } from "../http";
import type { HttpAdapter } from "../types";
import type { ApplicationOptions, Constructor } from "../types/container";

/** Chave para metadados de configuração da aplicação */
const APPLICATION_META = "application:options";

/**
 * Decorator que marca uma classe como aplicação principal do framework
 * Configura o adapter HTTP e define as opções globais da aplicação
 * 
 * @param options - Configurações da aplicação
 * @param options.port - Porta do servidor (padrão: 3000)
 * @param options.adapter - Tipo do adapter HTTP ("express" ou "fastify")
 * @returns Decorator de classe
 * 
 * @example
 * ```typescript
 * @Application({
 *   port: 8080,
 *   adapter: 'fastify'
 * })
 * class MyApp {
 *   // Sua aplicação aqui
 * }
 * ```
 */
export function Application(options: ApplicationOptions = {}): ClassDecorator {
    return (target) => {
        // Registra a classe como aplicação principal
        metadataRegistry.application = target as any as Constructor;

        // Cria a instância do adapter baseado na configuração
        const adapterInstance: HttpAdapter =
            options.adapter === "express"
                ? new ExpressAdapter()
                : new FastifyAdapter();

        // Injeta a propriedade `adapter` direto no prototype
        Object.defineProperty(target.prototype, "adapter", {
            value: adapterInstance,
            writable: false,
            enumerable: false,
        });

        // Define os metadados da aplicação
        Reflect.defineMetadata(
            APPLICATION_META,
            {
                port: options.port ?? 3000,
                adapter: options.adapter ?? "fastify",
            },
            target
        );
    };
}

/**
 * Obtém as configurações da aplicação a partir dos metadados
 * @param target - Classe da aplicação
 * @returns Configurações da aplicação ou objeto vazio se não houver metadados
 * 
 * @example
 * ```typescript
 * const options = getApplicationOptions(MyApp);
 * console.log(`Porta: ${options.port}, Adapter: ${options.adapter}`);
 * ```
 */
export function getApplicationOptions(target: Constructor): ApplicationOptions {
    return Reflect.getMetadata(APPLICATION_META, target) ?? {};
}
