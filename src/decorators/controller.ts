import type { Constructor } from "../types";
import { metadataRegistry } from "../core/metadata-registry";

/**
 * Normaliza um caminho de rota removendo barras desnecessárias
 * @param path - Caminho a ser normalizado
 * @returns Caminho normalizado
 * @private
 */
function normalizePath(path: string): string {
    if (!path.startsWith("/")) path = "/" + path;
    return path.replace(/\/+$/, ""); // remove barra final
}

/**
 * Decorator que marca uma classe como controlador HTTP
 * Registra o controlador no sistema de roteamento e define o caminho base
 * 
 * @param basePath - Caminho base para todas as rotas do controlador (padrão: "/")
 * @returns Decorator de classe
 * 
 * @example
 * ```typescript
 * @Controller("/api/users")
 * class UserController {
 *   @Get("/")
 *   getUsers() {
 *     // Responde em /api/users/
 *   }
 * 
 *   @Get("/:id")
 *   getUser() {
 *     // Responde em /api/users/:id
 *   }
 * }
 * 
 * @Controller() // Sem prefixo
 * class HomeController {
 *   @Get("/")
 *   home() {
 *     // Responde em /
 *   }
 * }
 * ```
 */
export function Controller(basePath: string = "/"): ClassDecorator {
    return (target) => {
        // Registra o controlador no metadata registry
        metadataRegistry.controllers.add(target as any as Constructor);

        // Normaliza o caminho base
        basePath = normalizePath(basePath);
        if (basePath === "/") {
            // Se o caminho base é apenas "/", define como string vazia
            basePath = "";
        }
        
        // Armazena o caminho base nos metadados do controlador
        Reflect.defineMetadata("controller:path", basePath, target);
    };
}
