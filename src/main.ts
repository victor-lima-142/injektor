import "reflect-metadata";
import {
    ExpressAdapter,
    FastifyAdapter,
    getApplicationOptions,
    GlobalContainer,
    loadModulesFrom,
    metadataRegistry,
    registerHttpRoutes,
    scanAndRegister,
    type HttpAdapter,
} from ".";

/**
 * Remove a parte à direita da última barra em um caminho
 * Utilizado para obter o diretório pai de um arquivo
 * @param p - Caminho original
 * @returns Caminho do diretório pai
 * @private
 */
function removeRightOfLastSlash(p: string): string {
    const path = p.replaceAll("file:///", "").replaceAll("file://", "");
    const lastSlashIndex = path.lastIndexOf("/");
    if (lastSlashIndex === -1) {
        return path;
    }
    return path.substring(0, lastSlashIndex);
}

/**
 * Função principal de bootstrap da aplicação
 * Inicializa todo o framework, carrega módulos, registra componentes e inicia o servidor HTTP
 * 
 * Processo de bootstrap:
 * 1. Carrega e escaneia módulos do diretório
 * 2. Registra todos os componentes no container DI
 * 3. Resolve e executa a aplicação principal
 * 4. Configura e inicia o servidor HTTP
 * 
 * @param AppClass - Classe principal da aplicação marcada com @Application
 * @param url - URL do arquivo principal (usado para determinar o diretório dos módulos)
 * 
 * @example
 * ```typescript
 * // No arquivo main do projeto
 * import { bootstrap } from './framework';
 * import { MyApp } from './app';
 * 
 * await bootstrap(MyApp, import.meta.url);
 * ```
 */
export async function bootstrap(
    AppClass: typeof metadataRegistry.application,
    url: string
) {
    // 1. Carrega e escaneia módulos
    await loadModulesFrom(removeRightOfLastSlash(url));
    await scanAndRegister();

    // 2. Obtém e executa a aplicação principal
    if (!AppClass) throw new Error("Nenhuma classe @Application encontrada.");
    const opts = getApplicationOptions(AppClass);
    const appInstance = GlobalContainer.resolve(AppClass);
    if (typeof appInstance.run === "function") {
        await appInstance.run();
    }

    // 3. Inicia o servidor HTTP
    const adapter: HttpAdapter =
        opts.adapter === "express"
            ? new ExpressAdapter()
            : new FastifyAdapter();
    adapter.init();

    registerHttpRoutes(adapter);
    await adapter.listen(opts.port!);
}
