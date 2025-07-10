/**
 * Opções de configuração para o carregador de módulos
 */
export type LoaderOptions = {
    /** Se verdadeiro, suprime mensagens de log durante o carregamento */
    silent?: boolean;
    /** Array de expressões regulares para ignorar arquivos específicos */
    ignore?: RegExp[];
};
