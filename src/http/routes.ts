import type { HttpAdapter } from "../types";
import { GlobalContainer, metadataRegistry } from "../core";
import { cleanupRequest, applyLifecycle } from "../core/life-cycle";

/**
 * Gera um ID único para cada requisição HTTP
 * Usado para rastrear e gerenciar instâncias request-scoped
 * @returns ID único da requisição
 * @private
 */
function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Registra todas as rotas HTTP dos controladores no adapter
 * Processa todos os controladores registrados e suas rotas,
 * configurando handlers com gerenciamento de ciclo de vida
 *
 * @param adapter - Adapter HTTP (Express ou Fastify)
 *
 * @example
 * ```typescript
 * const adapter = new FastifyAdapter();
 * adapter.init();
 * registerHttpRoutes(adapter);
 * await adapter.listen(3000);
 * ```
 */
export function registerHttpRoutes(adapter: HttpAdapter): void {
    console.log(
        `[INFO] [ROUTES] Registrando rotas HTTP...`
    );

    for (const controllerClass of metadataRegistry.controllers) {
        const basePath = Reflect.getMetadata(
            "controller:path",
            controllerClass
        );

        const routes = metadataRegistry.httpRoutes.get(controllerClass) ?? [];
        const sufixRoute = routes.length > 1 ? `s` : "";
        console.log(
            `[INFO] [ROUTES] Controlador ${controllerClass.name}: ${routes.length} rota${sufixRoute}`
        );

        for (const route of routes) {
            const fullPath = basePath + route.path;
            console.log(
                `  └─ ${route.method} ${fullPath} -> ${route.handlerName}`
            );

            adapter.registerRoute(
                route.method,
                fullPath,
                async (req: any, res: any) => {
                    const requestId = generateRequestId();

                    try {
                        // Resolver o controlador com o ciclo de vida apropriado
                        const controllerInstance =
                            resolveControllerWithLifecycle(
                                controllerClass,
                                requestId
                            );

                        const boundHandler =
                            controllerInstance[route.handlerName].bind(
                                controllerInstance
                            );
                        const result = await boundHandler(req, res);

                        // Resposta baseada no tipo de adapter
                        if (res?.send && typeof res.send === "function") {
                            return res.send(result);
                        }
                        if (res?.json && typeof res.json === "function") {
                            return res.json(result);
                        }
                        return result;
                    } catch (err: any) {
                        console.error(
                            `❌ Erro na rota ${route.method} ${fullPath}:`,
                            err
                        );

                        const error: Error =
                            err instanceof Error ? err : new Error(String(err));

                        if (res?.status && typeof res.status === "function") {
                            return res.status(500).send({
                                error: error.message,
                                requestId,
                            });
                        }
                        throw err;
                    } finally {
                        // Sempre limpar as instâncias de request após o processamento
                        try {
                            await cleanupRequest(requestId);
                            GlobalContainer.clearRequestInstances(requestId);
                        } catch (cleanupError) {
                            console.error(
                                `❌ Erro no cleanup da requisição ${requestId}:`,
                                cleanupError
                            );
                        }
                    }
                }
            );
        }
    }
}

/**
 * Resolve uma instância de controlador aplicando o ciclo de vida apropriado
 * Gerencia diferentes escopos (singleton, transient, request) para controladores
 *
 * @param controllerClass - Classe do controlador
 * @param requestId - ID da requisição HTTP
 * @returns Instância do controlador com ciclo de vida aplicado
 * @private
 */
function resolveControllerWithLifecycle(
    controllerClass: any,
    requestId: string
): any {
    const scope =
        Reflect.getMetadata("service:scope", controllerClass) ?? "singleton";

    let controllerInstance;

    switch (scope) {
        case "singleton":
            // Para singleton, já foi resolvido e teve lifecycle aplicado no scanner
            controllerInstance = GlobalContainer.resolve(controllerClass);
            break;

        case "transient":
            // Para transient, criar nova instância e aplicar lifecycle
            controllerInstance = GlobalContainer.resolve(
                controllerClass,
                requestId
            );
            applyLifecycle(controllerInstance, "transient");
            break;

        case "request":
            // Para request, resolver com requestId e aplicar lifecycle específico
            controllerInstance = GlobalContainer.resolve(
                controllerClass,
                requestId
            );
            applyLifecycle(controllerInstance, "request", requestId);
            break;

        default:
            throw new Error(`Escopo não suportado para controlador: ${scope}`);
    }

    return controllerInstance;
}
