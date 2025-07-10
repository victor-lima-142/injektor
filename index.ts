/**
 * Arquivo principal de entrada do framework
 * Importa o reflect-metadata necessário para o funcionamento dos decorators
 * 
 * Este arquivo deve ser importado antes de qualquer outro código que use
 * decorators do framework para garantir que o Reflect funcione corretamente
 * 
 * @example
 * ```typescript
 * import './index'; // ou import 'seu-framework'
 * import { Application, Controller, Service } from 'seu-framework';
 * ```
 */
import 'reflect-metadata';

export * from './src';