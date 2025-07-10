/**
 * Tipo genérico para construtores de classes
 * @template T - O tipo da instância que o construtor criará
 */
export type Constructor<T = any> = new (...args: any[]) => T;

/**
 * Opções de ciclo de vida disponíveis para componentes
 * - singleton: Uma única instância compartilhada em toda a aplicação
 * - transient: Nova instância criada a cada resolução
 * - request: Uma instância por requisição HTTP
 */
export type LifeCycleOpt = "singleton" | "transient" | "request";

/**
 * Configuração de ciclo de vida para componentes singleton
 * Instância única compartilhada em toda a aplicação
 */
export interface LifeCycleSingleton {
    scope: "singleton";
    /** Instância única compartilhada em toda a aplicação */
}

/**
 * Configuração de ciclo de vida para componentes transient
 * Nova instância criada a cada resolução
 */
export interface LifeCycleTransient {
    scope: "transient";
    /** Nova instância a cada resolução */
}

/**
 * Configuração de ciclo de vida para componentes request-scoped
 * Uma instância por requisição HTTP
 */
export interface LifeCycleRequest {
    scope: "request";
    /** Uma instância por requisição HTTP */
}

/**
 * União de todas as configurações de ciclo de vida disponíveis
 */
export type LifeCycleConfig = LifeCycleSingleton | LifeCycleTransient | LifeCycleRequest;

/**
 * Alias mantido para compatibilidade com versões anteriores
 * @deprecated Use LifeCycleOpt em vez disso
 */
export type ServiceScope = LifeCycleOpt;

/**
 * Interface que define como um provedor deve ser configurado no container
 * @template T - O tipo da instância que será provida
 */
export interface Provider<T = any> {
    /** Classe a ser instanciada pelo container */
    useClass?: Constructor<T>;
    /** Valor pré-existente a ser retornado */
    useValue?: T;
    /** Função factory para criar a instância */
    useFactory?: (...args: any[]) => T;
    /** Escopo do ciclo de vida da instância */
    scope?: LifeCycleOpt;
}

/**
 * Definição de um bean criado através de métodos decorados
 */
export type BeanDefinition = {
    /** Nome do método que cria o bean */
    methodName: string;
    /** Token usado para identificar o bean no container */
    token: string | symbol | Constructor;
};

/**
 * Opções de configuração para serviços
 */
export interface ServiceOptions {
    /** Escopo do ciclo de vida (legacy) */
    scope?: LifeCycleOpt;
    /** Configuração completa do ciclo de vida */
    lifecycle?: LifeCycleConfig;
}

/**
 * Opções de configuração para processadores
 */
export interface ProcessorOptions {
    /** Escopo do ciclo de vida (legacy) */
    scope?: LifeCycleOpt;
    /** Configuração completa do ciclo de vida */
    lifecycle?: LifeCycleConfig;
}

/**
 * Opções de configuração para aplicações
 */
export interface ApplicationOptions {
    /** Porta na qual a aplicação será executada (padrão: 3000) */
    port?: number;
    /** Adapter HTTP a ser usado (padrão: "fastify") */
    adapter?: "fastify" | "express";
}
