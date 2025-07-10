import type { Constructor, HttpRouteMetadata } from "../types";

/**
 * Registry global de metadados para todos os componentes do framework
 * Mantém referências organizadas de todos os tipos de componentes registrados
 * 
 * Este registry é usado durante o processo de escaneamento e registro
 * para identificar e configurar todos os componentes da aplicação
 * 
 * @example
 * ```typescript
 * // Acessar serviços registrados
 * console.log(`Serviços: ${metadataRegistry.services.size}`);
 * 
 * // Acessar rotas HTTP de um controlador
 * const routes = metadataRegistry.httpRoutes.get(MyController);
 * ```
 */
export const metadataRegistry = {
    /** Conjunto de classes marcadas como @Service */
    services: new Set<Constructor>(),
    
    /** Conjunto de classes marcadas como @Controller */
    controllers: new Set<Constructor>(),
    
    /** Conjunto de classes marcadas como @Configuration */
    configurations: new Set<Constructor>(),
    
    /** Conjunto de classes marcadas como @Processor */
    processors: new Set<Constructor>(),
    
    /** Classe principal da aplicação marcada com @Application */
    application: {} as Constructor,
    
    /** Conjunto de classes de middleware (funcionalidade futura) */
    middlewares: new Set<Constructor>(),
    
    /** Mapeamento de controladores para suas rotas HTTP */
    httpRoutes: new Map<Constructor, HttpRouteMetadata[]>(),
};
