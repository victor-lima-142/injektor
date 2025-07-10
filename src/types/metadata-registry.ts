/**
 * Metadados de uma rota HTTP registrada no sistema
 * Contém informações sobre o método, caminho e handler da rota
 */
export interface HttpRouteMetadata {
    /** Método HTTP da rota (GET, POST, PUT, DELETE, PATCH) */
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    /** Caminho da rota (ex: "/users", "/api/v1/products") */
    path: string;
    /** Nome do método handler que processará a requisição */
    handlerName: string;
}
