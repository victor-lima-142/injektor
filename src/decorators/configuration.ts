import type { BeanDefinition, Constructor } from "../types";
import { metadataRegistry } from "../core/metadata-registry";

/** Chave para metadados de beans de configuração */
const beanMetadataKey = "configuration:beans";

/**
 * Decorator que marca uma classe como classe de configuração
 * Classes de configuração são processadas durante a inicialização
 * e podem fornecer beans e valores para o container de DI
 * 
 * @returns Decorator de classe
 * 
 * @example
 * ```typescript
 * @Configuration()
 * class AppConfig {
 *   @Bean()
 *   databaseUrl(): string {
 *     return process.env.DATABASE_URL || 'sqlite://memory';
 *   }
 * 
 *   @Bean('apiKey')
 *   getApiKey(): string {
 *     return process.env.API_KEY!;
 *   }
 * }
 * ```
 */
export function Configuration(): ClassDecorator {
    return (target) => {
        metadataRegistry.configurations.add(target as any as Constructor);
    };
}

/**
 * Decorator que marca um método como provedor de bean
 * O valor retornado pelo método será registrado no container de DI
 * 
 * @param token - Token para identificar o bean (opcional, usa o nome do método se não fornecido)
 * @returns Decorator de método
 * 
 * @example
 * ```typescript
 * @Configuration()
 * class AppConfig {
 *   @Bean() // Token será 'logger'
 *   logger(): Logger {
 *     return new Logger();
 *   }
 * 
 *   @Bean('customName') // Token será 'customName'
 *   someValue(): string {
 *     return 'custom value';
 *   }
 * 
 *   @Bean(MyService) // Token será a classe MyService
 *   myService(): MyService {
 *     return new MyService();
 *   }
 * }
 * ```
 */
export function Bean(token?: string | symbol | Constructor): MethodDecorator {
    return (target, propertyKey) => {
        const clazz = target.constructor as Constructor;

        const existingBeans: BeanDefinition[] =
            Reflect.getMetadata(beanMetadataKey, clazz) ?? [];

        existingBeans.push({
            methodName: propertyKey as string,
            token: token ?? (propertyKey as string),
        });

        Reflect.defineMetadata(beanMetadataKey, existingBeans, clazz);
    };
}

/**
 * Obtém todas as definições de beans de uma classe de configuração
 * @param clazz - Classe de configuração
 * @returns Array de definições de beans
 * 
 * @example
 * ```typescript
 * const beans = getBeanDefinitions(AppConfig);
 * console.log(`Encontrados ${beans.length} beans`);
 * ```
 */
export function getBeanDefinitions(clazz: Constructor): BeanDefinition[] {
    return Reflect.getMetadata(beanMetadataKey, clazz) ?? [];
}
