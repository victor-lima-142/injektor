import { Service } from "../src/decorators/service";
import { Processor } from "../src/decorators/processor";
import type { RequestLifeCycleAware } from "../src/core/life-cycle";
import { Logger } from "./config/logger";

/**
 * Serviço de saudação com escopo singleton (padrão)
 *
 * Este serviço demonstra o comportamento padrão do framework onde
 * uma única instância é criada e reutilizada em toda a aplicação.
 *
 * Implementa LifeCycleAware para demonstrar os hooks de ciclo de vida.
 *
 * @example
 * ```typescript
 * // Injetado automaticamente nos controladores
 * const greeting = helloService.greet("mundo");
 * ```
 */
@Service()
export class HelloService {
    /**
     * Construtor do HelloService
     *
     * @param logger - Logger para registrar operações
     */
    constructor(private logger: Logger) {}

    /**
     * Gera uma mensagem de saudação
     *
     * @param name - Nome para saudar
     * @returns {object} Objeto contendo a mensagem de saudação
     * @example
     * ```typescript
     * const result = helloService.greet("João");
     * // { message: "Olá, João!" }
     * ```
     */
    greet(name: string) {
        const message = `Olá, ${name}!`;
        this.logger.log(message);
        return { message };
    }
}

/**
 * Serviço com escopo transient (nova instância a cada resolução)
 *
 * Este serviço demonstra o comportamento transient onde uma nova
 * instância é criada a cada vez que o serviço é solicitado.
 *
 * Útil para serviços que precisam manter estado isolado ou
 * que são computacionalmente leves.
 *
 * @example
 * ```typescript
 * // Cada injeção cria uma nova instância
 * const service1 = container.resolve(TransientService);
 * const service2 = container.resolve(TransientService);
 * // service1 !== service2
 * ```
 */
@Service({ scope: "transient" })
export class TransientService {
    /** ID único desta instância */
    private instanceId = Math.random();

    /**
     * Retorna informações sobre esta instância
     *
     * @returns {object} Informações da instância incluindo ID único
     * @example
     * ```typescript
     * const info = transientService.getInstanceId();
     * // {
     * //   instanceId: "abc123def",
     * //   type: "transient",
     * //   message: "Nova instância a cada resolução"
     * // }
     * ```
     */
    getInstanceId(): number {
        return this.instanceId;
    }
}

/**
 * Serviço com escopo de requisição (uma instância por requisição HTTP)
 *
 * Este serviço demonstra o comportamento request-scoped onde uma
 * instância é criada por requisição HTTP e reutilizada durante
 * toda a requisição.
 *
 * Ideal para serviços que precisam manter estado durante uma
 * requisição mas devem ser isolados entre requisições.
 *
 * @example
 * ```typescript
 * // Dentro de uma requisição HTTP:
 * const service1 = container.resolve(RequestScopedService);
 * const service2 = container.resolve(RequestScopedService);
 * // service1 === service2 (mesma requisição)
 *
 * // Em uma nova requisição:
 * const service3 = container.resolve(RequestScopedService);
 * // service3 !== service1 (requisição diferente)
 * ```
 */
@Service({ scope: "request" })
export class RequestScopedService implements RequestLifeCycleAware {
    /** ID único desta instância */
    private instanceId = Math.random().toString(36).substr(2, 9);
    /** ID da requisição atual */
    private requestId?: string;

    /**
     * Construtor do RequestScopedService
     *
     * @param logger - Logger para registrar operações
     */
    constructor(private logger: Logger) {}

    /**
     * Hook chamado quando a instância é inicializada
     *
     * Para serviços request-scoped, este método é chamado
     * uma vez por requisição HTTP
     */
    onInit() {}

    /**
     * Hook chamado quando uma nova requisição HTTP inicia
     *
     * @param requestId - ID único da requisição
     */
    onRequestStart(requestId: string) {
        this.requestId = requestId;
        this.logger.log(
            `RequestScopedService [${this.instanceId}] iniciando requisição ${requestId}`
        );
    }

    /**
     * Hook chamado quando a requisição HTTP termina
     */
    onRequestEnd() {
        this.logger.log(
            `RequestScopedService [${this.instanceId}] finalizando requisição ${this.requestId}`
        );
    }

    /**
     * Hook chamado quando a instância é destruída
     *
     * Para serviços request-scoped, este método é chamado
     * ao final da requisição HTTP
     */
    onDestroy() {
        this.logger.log(
            `RequestScopedService [${this.instanceId}] sendo destruído`
        );
    }

    /**
     * Retorna informações sobre esta instância e a requisição atual
     *
     * @returns {object} Informações da instância e da requisição
     * @example
     * ```typescript
     * const info = requestScopedService.getRequestInfo();
     * // {
     * //   instanceId: "abc123def",
     * //   requestId: "req_456789",
     * //   type: "request",
     * //   message: "Uma instância por requisição HTTP"
     * // }
     * ```
     */
    getRequestInfo() {
        return {
            instanceId: this.instanceId,
            requestId: this.requestId,
            type: "request",
            message: "Uma instância por requisição HTTP",
        };
    }
}

/**
 * Processador de dados usando o decorator @Processor
 *
 * Este processador demonstra o uso do decorator @Processor
 * com configuração de ciclo de vida singleton.
 *
 * Os processadores são uma funcionalidade especial do framework
 * para operações de processamento de dados.
 *
 * @example
 * ```typescript
 * const result = dataProcessor.process({
 *   input: "dados de exemplo",
 *   timestamp: new Date().toISOString()
 * });
 * ```
 */
@Processor({
    lifecycle: { scope: "singleton" },
})
export class DataProcessor {
    /**
     * Construtor do DataProcessor
     *
     * @param logger - Logger para registrar operações
     */
    constructor(private logger: Logger) {}

    /**
     * Processa os dados fornecidos
     *
     * @param data - Dados a serem processados
     * @returns {object} Resultado do processamento com timestamp
     * @example
     * ```typescript
     * const result = dataProcessor.process({
     *   input: "teste",
     *   value: 42
     * });
     * // {
     * //   processed: true,
     * //   timestamp: "2023-12-07T10:30:00.000Z",
     * //   data: { input: "teste", value: 42 }
     * // }
     * ```
     */
    process(data: any) {
        this.logger.log(`Processando dados: ${JSON.stringify(data)}`);
        return {
            processed: true,
            timestamp: new Date().toISOString(),
            data,
        };
    }
}

// Primeiro declaramos ExampleService (sem dependências)
@Service()
export class ExampleService {
    getMessage(): string {
        return "Hello from ExampleService!";
    }
}

// Depois declaramos DependentService (que depende de ExampleService)
@Service()
export class DependentService {
    constructor(private exampleService: ExampleService) {}

    processMessage(): string {
        return `Processed: ${this.exampleService.getMessage()}`;
    }
}