import express, { type Request, type Response } from "express";
import type { HttpAdapter } from "../types";

/**
 * Adapter HTTP para integração com o framework Express
 * Implementa a interface HttpAdapter para permitir uso do Express como servidor HTTP
 * 
 * @example
 * ```typescript
 * const adapter = new ExpressAdapter();
 * await adapter.init();
 * adapter.registerRoute('GET', '/users', (req, res) => {
 *   res.json({ users: [] });
 * });
 * await adapter.listen(3000);
 * ```
 */
export class ExpressAdapter implements HttpAdapter {
    /** Instância do aplicativo Express */
    private app = express();

    /**
     * Inicializa o adapter Express com middlewares básicos
     * Configura o middleware para parsing de JSON
     */
    init(): void {
        this.app.use(express.json());
    }

    /**
     * Registra uma rota HTTP no Express
     * @param method - Método HTTP (GET, POST, PUT, DELETE, PATCH)
     * @param path - Caminho da rota
     * @param handler - Função que processará a requisição
     * 
     * @example
     * ```typescript
     * adapter.registerRoute('GET', '/api/users', (req, res) => {
     *   res.json({ message: 'Users endpoint' });
     * });
     * ```
     */
    registerRoute(
        method: string,
        path: string,
        handler: (req: Request, res: Response) => any
    ): void {
        (this.app as any)[method.toLowerCase()](path, handler);
    }

    /**
     * Inicia o servidor Express na porta especificada
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
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                console.log(
                    `\n[SERVER] ● Express server running on port :${port} with my own DI framework`
                );
                resolve();
            });
        });
    }
}
