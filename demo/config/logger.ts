/**
 * Tipos de log disponíveis no sistema
 *
 * Define os diferentes níveis de logging que podem ser utilizados
 * na aplicação.
 *
 * @example
 * ```typescript
 * const logLevel: LoggerType = "error";
 * ```
 */
export type LoggerType = "log" | "warn" | "error" | "debug" | "info";

/**
 * Interface que define o contrato para implementações de logger
 *
 * Esta interface garante que qualquer implementação de logger
 * terá todos os métodos necessários para logging em diferentes níveis.
 *
 * @example
 * ```typescript
 * class CustomLogger implements ILogger {
 *   log(msg: string) { // implementação customizada }
 *   warn(msg: string) { // implementação customizada }
 *   // ... outros métodos
 * }
 * ```
 */
export interface ILogger {
    /**
     * Método para logging de informações gerais
     * @param msg - Mensagem a ser logada
     */
    log(msg: string): void;

    /**
     * Método para logging de avisos
     * @param msg - Mensagem de aviso a ser logada
     */
    warn(msg: string): void;

    /**
     * Método para logging de erros
     * @param msg - Mensagem de erro a ser logada
     */
    error(msg: string): void;

    /**
     * Método para logging de debug
     * @param msg - Mensagem de debug a ser logada
     */
    debug(msg: string): void;

    /**
     * Método para logging de informações importantes
     * @param msg - Mensagem informativa a ser logada
     */
    info(msg: string): void;
}

/**
 * Implementação concreta do sistema de logging
 *
 * Esta classe fornece uma implementação básica do sistema de logging
 * usando os métodos console padrão do JavaScript/Node.js.
 *
 * Implementa a interface ILogger para garantir consistência
 * na assinatura dos métodos de logging.
 *
 * @example
 * ```typescript
 * const logger = new Logger();
 * logger.log("Mensagem informativa");
 * logger.error("Algo deu errado");
 * ```
 */
export class Logger implements ILogger {
    /**
     * Registra uma mensagem de log informativa
     *
     * @param msg - Mensagem a ser logada (string ou objeto)
     * @example
     * ```typescript
     * logger.log("Operação realizada com sucesso");
     * logger.log({ user: "João", action: "login" });
     * ```
     */
    log(msg: string) {
        if (typeof msg === "object") msg = JSON.stringify(msg);
        else msg = String(msg);

        console.log(`[LOG] ${msg}`);
    }

    /**
     * Registra uma mensagem de aviso
     *
     * @param msg - Mensagem de aviso a ser logada (string ou objeto)
     * @example
     * ```typescript
     * logger.warn("Esta operação está depreciada");
     * logger.warn({ deprecated: true, method: "oldMethod" });
     * ```
     */
    warn(msg: string) {
        if (typeof msg === "object") msg = JSON.stringify(msg);
        else msg = String(msg);

        console.warn(`[WARN] ${msg}`);
    }

    /**
     * Registra uma mensagem de erro
     *
     * @param msg - Mensagem de erro a ser logada (string ou objeto)
     * @example
     * ```typescript
     * logger.error("Falha na conexão com o banco");
     * logger.error({ error: "CONNECTION_FAILED", code: 500 });
     * ```
     */
    error(msg: string) {
        if (typeof msg === "object") msg = JSON.stringify(msg);
        else msg = String(msg);

        console.error(`[ERROR] ${msg}`);
    }

    /**
     * Registra uma mensagem de debug
     *
     * Útil para informações detalhadas durante o desenvolvimento
     * e resolução de problemas.
     *
     * @param msg - Mensagem de debug a ser logada (string ou objeto)
     * @example
     * ```typescript
     * logger.debug("Valor da variável: " + value);
     * logger.debug({ step: "validation", data: inputData });
     * ```
     */
    debug(msg: string) {
        if (typeof msg === "object") msg = JSON.stringify(msg);
        else msg = String(msg);

        console.debug(`[DEBUG] ${msg}`);
    }

    /**
     * Registra uma mensagem informativa
     *
     * Similar ao log(), mas específico para informações importantes
     * que devem ser destacadas.
     *
     * @param msg - Mensagem informativa a ser logada (string ou objeto)
     * @example
     * ```typescript
     * logger.info("Aplicação iniciada na porta 8080");
     * logger.info({ event: "startup", port: 8080, env: "production" });
     * ```
     */
    info(msg: string) {
        if (typeof msg === "object") msg = JSON.stringify(msg);
        else msg = String(msg);

        console.info(`[INFO] ${msg}`);
    }
}
