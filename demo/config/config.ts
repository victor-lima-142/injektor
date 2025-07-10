import { Configuration, Bean } from "../../src/decorators/configuration";
import { Logger } from "./logger";

/**
 * Classe de configuração da aplicação demo
 * 
 * Esta classe demonstra como usar o decorator @Configuration
 * para definir beans e configurações da aplicação.
 * 
 * As classes de configuração são escaneadas automaticamente
 * pelo framework e seus métodos @Bean são registrados no container.
 * 
 * @example
 * ```typescript
 * // Os beans definidos aqui ficam disponíveis para injeção
 * // em toda a aplicação automaticamente
 * ```
 */
@Configuration()
export class AppConfig {
    /**
     * Define um bean Logger para injeção de dependências
     * 
     * Este método cria e configura uma instância do Logger
     * que será usada em toda a aplicação.
     * 
     * @returns {Logger} Instância configurada do Logger
     * @example
     * ```typescript
     * // O Logger estará disponível para injeção automática:
     * constructor(private logger: Logger) {}
     * ```
     */
    @Bean(Logger)
    logger() {
        return new Logger();
    }
}
