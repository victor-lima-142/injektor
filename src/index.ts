/**
 * Arquivo principal de exportação do framework
 * Reexporta todos os módulos e funcionalidades do framework
 * para facilitar a importação pelos usuários
 * 
 * @example
 * ```typescript
 * import { 
 *   Application, 
 *   Controller, 
 *   Service, 
 *   Get, 
 *   Post,
 *   bootstrap 
 * } from 'framework';
 * ```
 */

/** Exporta funcionalidades do núcleo do framework */
export * from "./core";

/** Exporta todos os decorators disponíveis */
export * from "./decorators";

/** Exporta adaptadores HTTP e utilitários de roteamento */
export * from "./http";

/** Exporta todas as interfaces e tipos TypeScript */
export * from "./types";

/** Exporta a função principal de bootstrap */
export * from "./main";

/** Exporta utilitários de runtime multi-plataforma */
export * from "./runtime";
