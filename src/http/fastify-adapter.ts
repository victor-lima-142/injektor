import fastify from "fastify";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { HttpAdapter } from "../types";

/**
 * Adapter HTTP para integração com o framework Fastify
 * Implementa a interface HttpAdapter para permitir uso do Fastify como servidor HTTP
 * 
 * @example
 * ```typescript
 * const adapter = new FastifyAdapter();
 * await adapter.init();
 * adapter.registerRoute('GET', '/users', (req, res) => {
 *   res.send({ users: [] });
 * });
 * await adapter.listen(3000);
 * ```
 */
export class FastifyAdapter implements HttpAdapter {
    /** Instância do aplicativo Fastify */
    private app: FastifyInstance;

    /**
     * Cria uma nova instância do FastifyAdapter
     * Inicializa o servidor Fastify com configurações padrão
     */
    constructor() {
        this.app = fastify();
    }

    /**
     * Inicializa o adapter Fastify com configurações básicas
     * Futuramente pode incluir plugins como CORS, autenticação, etc.
     */
    init(): void {
        // Plugins futuros (CORS, etc)
    }

    /**
     * Registra uma rota HTTP no Fastify
     * @param method - Método HTTP (GET, POST, PUT, DELETE, PATCH)
     * @param path - Caminho da rota
     * @param handler - Função que processará a requisição
     * 
     * @example
     * ```typescript
     * adapter.registerRoute('GET', '/api/users', (req, res) => {
     *   res.send({ message: 'Users endpoint' });
     * });
     * ```
     */
    registerRoute(
        method: string,
        path: string,
        handler: (req: FastifyRequest, res: FastifyReply) => any
    ): void {
        this.app.route({
            method,
            url: path,
            handler,
        });
    }

    /**
     * Inicia o servidor Fastify na porta especificada
     * @param port - Porta na qual o servidor será executado
     * @returns Promise que resolve quando o servidor estiver rodando
     * 
     * @example
     * ```typescript
     * await adapter.listen(3000);
     * console.log('Servidor rodando na porta 3000');
     * ```
     */
    async listen(port: number): Promise<void> {
        await this.app.listen({ port });
        console.log(
            `\n[SERVER] ● Fastify server running on port :${port} with my own DI framework`
        );
    }
}
