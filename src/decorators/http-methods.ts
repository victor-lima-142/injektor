import type { Constructor, HttpRouteMetadata } from "../types";
import { metadataRegistry } from "../core/metadata-registry";

/**
 * Normaliza um caminho de rota HTTP removendo barras desnecessárias
 * @param path - Caminho da rota a ser normalizado
 * @returns Caminho normalizado
 * @private
 */
function normalizePath(path: string): string {
    if (!path.startsWith("/")) path = "/" + path;
    return path.replace(/\/+$/, "");
}

/**
 * Cria um decorator HTTP para um método específico
 * @param method - Método HTTP (GET, POST, PUT, DELETE, PATCH)
 * @returns Função decorator que pode ser aplicada a métodos de controlador
 * @private
 */
function createHttpMethodDecorator(method: HttpRouteMetadata["method"]) {
    return function (path: string = "/"): MethodDecorator {
        return (target, propertyKey) => {
            const controller = target.constructor as Constructor;
            const normalizedPath = normalizePath(path);

            const routes = metadataRegistry.httpRoutes.get(controller) ?? [];
            routes.push({
                method,
                path: normalizedPath,
                handlerName: propertyKey as string,
            });

            metadataRegistry.httpRoutes.set(controller, routes);
        };
    };
}

/**
 * Decorator para definir uma rota HTTP GET
 * @param path - Caminho da rota (padrão: "/")
 * @returns Decorator de método
 * 
 * @example
 * ```typescript
 * @Controller("/users")
 * class UserController {
 *   @Get("/")
 *   getAllUsers() {
 *     // Responde GET /users/
 *   }
 * 
 *   @Get("/:id")
 *   getUser() {
 *     // Responde GET /users/:id
 *   }
 * }
 * ```
 */
export const Get = createHttpMethodDecorator("GET");

/**
 * Decorator para definir uma rota HTTP POST
 * @param path - Caminho da rota (padrão: "/")
 * @returns Decorator de método
 * 
 * @example
 * ```typescript
 * @Controller("/users")
 * class UserController {
 *   @Post("/")
 *   createUser() {
 *     // Responde POST /users/
 *   }
 * }
 * ```
 */
export const Post = createHttpMethodDecorator("POST");

/**
 * Decorator para definir uma rota HTTP PUT
 * @param path - Caminho da rota (padrão: "/")
 * @returns Decorator de método
 * 
 * @example
 * ```typescript
 * @Controller("/users")
 * class UserController {
 *   @Put("/:id")
 *   updateUser() {
 *     // Responde PUT /users/:id
 *   }
 * }
 * ```
 */
export const Put = createHttpMethodDecorator("PUT");

/**
 * Decorator para definir uma rota HTTP DELETE
 * @param path - Caminho da rota (padrão: "/")
 * @returns Decorator de método
 * 
 * @example
 * ```typescript
 * @Controller("/users")
 * class UserController {
 *   @Delete("/:id")
 *   deleteUser() {
 *     // Responde DELETE /users/:id
 *   }
 * }
 * ```
 */
export const Delete = createHttpMethodDecorator("DELETE");

/**
 * Decorator para definir uma rota HTTP PATCH
 * @param path - Caminho da rota (padrão: "/")
 * @returns Decorator de método
 * 
 * @example
 * ```typescript
 * @Controller("/users")
 * class UserController {
 *   @Patch("/:id")
 *   partialUpdateUser() {
 *     // Responde PATCH /users/:id
 *   }
 * }
 * ```
 */
export const Patch = createHttpMethodDecorator("PATCH");
