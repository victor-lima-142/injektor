import "reflect-metadata";

import { Application, bootstrap, GlobalContainer } from "../src";

/**
 * Classe principal da aplicação demo
 *
 * Esta é a classe de entrada da aplicação de demonstração que mostra
 * como usar o framework d-i com diferentes tipos de serviços e controladores.
 *
 * @example
 * ```typescript
 * // A aplicação será iniciada automaticamente na porta 8080
 * // usando o adaptador Express
 * ```
 */
@Application({ port: 8080, adapter: "express" })
export class MainApp {}

// Registra a aplicação no container global
GlobalContainer.register(MainApp, { useClass: MainApp });

/**
 * Inicia a aplicação demo
 *
 * Esta função faz o bootstrap da aplicação, carregando todos os
 * controladores, serviços e configurações definidas.
 */
bootstrap(MainApp, import.meta.url);
