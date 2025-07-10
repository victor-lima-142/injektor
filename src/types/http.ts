/**
 * Interface que define um adaptador HTTP para diferentes frameworks web
 * Permite abstrair a implementação específica do framework (Express, Fastify, etc.)
 */
export type HttpAdapter = {
    /**
     * Inicializa o adaptador HTTP com configurações básicas
     * @returns Promise que resolve quando a inicialização estiver completa, ou void se for síncrona
     */
    init(): Promise<void> | void;
    
    /**
     * Registra uma rota HTTP no adaptador
     * @param method - Método HTTP a ser usado (GET, POST, PUT, DELETE, PATCH)
     * @param path - Caminho da rota (ex: "/users", "/api/v1/products")
     * @param handler - Função que processará as requisições para esta rota
     */
    registerRoute(
        method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
        path: string,
        handler: (...args: any[]) => any
    ): void;
    
    /**
     * Inicia o servidor HTTP na porta especificada
     * @param port - Porta na qual o servidor será executado
     * @returns Promise que resolve quando o servidor estiver rodando
     */
    listen(port: number): Promise<void>;
};
