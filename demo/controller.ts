import { Controller } from "../src/decorators/controller";
import { Get, Post } from "../src/decorators/http-methods";
import { 
    HelloService, 
    TransientService, 
    RequestScopedService, 
    DataProcessor 
} from "./service";

/**
 * Controlador de demonstração da aplicação
 * 
 * Este controlador demonstra diferentes funcionalidades do framework:
 * - Injeção de dependências com diferentes escopos
 * - Endpoints HTTP (GET e POST)
 * - Integração com serviços singleton, transient e request-scoped
 * 
 * @example
 * ```typescript
 * // Endpoints disponíveis:
 * // GET /api/hello - Saudação básica
 * // GET /api/transient - Demonstra serviço transient
 * // GET /api/request-scoped - Demonstra serviço request-scoped
 * // POST /api/process - Processamento de dados
 * // GET /api/lifecycle-demo - Demonstração completa dos ciclos de vida
 * ```
 */
@Controller("/api")
export class HelloController {
    /**
     * Construtor do controlador
     * 
     * @param helloService - Serviço de saudação (singleton)
     * @param transientService - Serviço com escopo transient
     * @param requestScopedService - Serviço com escopo de requisição
     * @param dataProcessor - Processador de dados (singleton)
     */
    constructor(
        private helloService: HelloService,
        private transientService: TransientService,
        private requestScopedService: RequestScopedService,
        private dataProcessor: DataProcessor
    ) {}

    /**
     * Endpoint de saudação básica
     * 
     * @returns {object} Mensagem de saudação
     * @example
     * ```
     * GET /api/hello
     * Response: { "message": "Olá, mundo!" }
     * ```
     */
    @Get("/hello")
    index() {
        return this.helloService.greet("mundo");
    }

    /**
     * Demonstra o comportamento do serviço transient
     * 
     * A cada chamada, uma nova instância do serviço é criada
     * 
     * @returns {object} Informações sobre a instância transient
     * @example
     * ```
     * GET /api/transient
     * Response: {
     *   "message": "Testando serviço transient",
     *   "service": { "instanceId": "abc123", "type": "transient", ... }
     * }
     * ```
     */
    @Get("/transient")
    getTransientInfo() {
        return {
            message: "Testando serviço transient",
            service: this.transientService.getInstanceId()
        };
    }

    /**
     * Demonstra o comportamento do serviço request-scoped
     * 
     * Uma instância é criada por requisição HTTP e reutilizada
     * durante toda a requisição
     * 
     * @returns {object} Informações sobre a instância request-scoped
     * @example
     * ```
     * GET /api/request-scoped
     * Response: {
     *   "message": "Testando serviço request-scoped",
     *   "service": { "instanceId": "def456", "requestId": "req_789", ... }
     * }
     * ```
     */
    @Get("/request-scoped")
    getRequestScopedInfo() {
        return {
            message: "Testando serviço request-scoped",
            service: this.requestScopedService.getRequestInfo()
        };
    }

    /**
     * Processa dados usando o DataProcessor
     * 
     * @returns {object} Resultado do processamento
     * @example
     * ```
     * POST /api/process
     * Response: {
     *   "message": "Dados processados com sucesso",
     *   "result": { "processed": true, "timestamp": "2023-...", ... }
     * }
     * ```
     */
    @Post("/process")
    processData() {
        const sampleData = {
            input: "dados de exemplo",
            timestamp: new Date().toISOString()
        };

        const result = this.dataProcessor.process(sampleData);
        
        return {
            message: "Dados processados com sucesso",
            result
        };
    }

    /**
     * Demonstração completa dos diferentes ciclos de vida
     * 
     * Este endpoint mostra como cada tipo de serviço se comporta
     * em relação ao seu ciclo de vida e instanciação
     * 
     * @returns {object} Demonstração completa dos ciclos de vida
     * @example
     * ```
     * GET /api/lifecycle-demo
     * Response: {
     *   "message": "Demonstração dos diferentes ciclos de vida",
     *   "services": {
     *     "singleton": { ... },
     *     "transient": { ... },
     *     "request": { ... },
     *     "processor": { ... }
     *   }
     * }
     * ```
     */
    @Get("/lifecycle-demo")
    lifecycleDemo() {
        return {
            message: "Demonstração dos diferentes ciclos de vida",
            services: {
                singleton: {
                    description: "HelloService - uma instância compartilhada",
                    example: this.helloService.greet("singleton")
                },
                transient: {
                    description: "TransientService - nova instância a cada resolução",
                    example: this.transientService.getInstanceId()
                },
                request: {
                    description: "RequestScopedService - uma instância por requisição",
                    example: this.requestScopedService.getRequestInfo()
                },
                processor: {
                    description: "DataProcessor - processador singleton",
                    example: this.dataProcessor.process({ test: "lifecycle demo" })
                }
            }
        };
    }
}
