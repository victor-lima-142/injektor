// src/core/scanner.ts

import { metadataRegistry } from "./metadata-registry";
import { GlobalContainer } from "./container";
import { getBeanDefinitions } from "../decorators/configuration";
import { getServiceScope } from "../decorators/service";
import { getProcessorScope } from "../decorators/processor";
import { applyLifecycle } from "./life-cycle";
import type { LifeCycleOpt } from "../types";

/**
 * Função principal que escaneia e registra todos os componentes da aplicação
 *
 * Processa os componentes na seguinte ordem:
 * 1. Configurations - para prover beans/valores
 * 2. Services - serviços de negócio
 * 3. Processors - processadores especiais
 * 4. Controllers - controladores HTTP
 * 5. Application - classe principal da aplicação
 * 6. Resolução de dependências pendentes
 *
 * @example
 * ```typescript
 * await scanAndRegister();
 * console.log('Todos os componentes foram registrados');
 * ```
 */
export async function scanAndRegister(): Promise<void> {
    console.log(
        "[INFO] [SCANNER] Iniciando escaneamento e registro de componentes..."
    );

    // 1. Configurations - processar primeiro pois podem fornecer beans
    await registerConfigurations();

    // 2. Services
    await registerServices();

    // 3. Processors
    await registerProcessors();

    // 4. Controllers
    await registerControllers();

    // 5. Application
    await registerApplication();

    // 6. Tentar resolver dependências que ficaram pendentes
    await GlobalContainer.resolvePendingDependencies();

    console.log("[INFO] [SCANNER] Escaneamento e registro concluído");
}

/**
 * Registra todas as classes de configuração e seus beans
 * Classes marcadas com @Configuration são processadas primeiro
 * pois podem fornecer beans e valores para outros componentes
 *
 * @private
 */
async function registerConfigurations(): Promise<void> {
    const sufix =
        metadataRegistry.configurations.size > 1
            ? `configurações`
            : "configuração";
    console.log(
        `[INFO] [SCANNER] Registrando ${metadataRegistry.configurations.size} ${sufix}...`
    );

    for (const configClass of metadataRegistry.configurations) {
        try {
            const configInstance = new configClass();
            applyLifecycle(configInstance, "singleton");

            const beans = getBeanDefinitions(configClass);
            for (const bean of beans) {
                const value = (configInstance as any)[bean.methodName]();
                GlobalContainer.register(bean.token, { useValue: value });
            }
        } catch (error) {
            console.error(
                `❌ Erro ao registrar configuração ${configClass.name}:`,
                error
            );
        }
    }
}

/**
 * Registra todos os serviços no container de DI
 * Serviços são classes marcadas com @Service e representam
 * a lógica de negócio da aplicação
 *
 * @private
 */
async function registerServices(): Promise<void> {
    const sufixServices =
        metadataRegistry.services.size > 1 ? `serviços` : "serviço";
    console.log(
        `[INFO] [SCANNER] Registrando ${metadataRegistry.services.size} ${sufixServices}...`
    );

    for (const serviceClass of metadataRegistry.services) {
        try {
            const scope = getServiceScope(serviceClass);

            GlobalContainer.register(serviceClass, {
                useClass: serviceClass,
                scope,
            });

            // Se for singleton, aplicar lifecycle imediatamente
            if (scope === "singleton") {
                const instance = GlobalContainer.resolve(serviceClass);
                applyLifecycle(instance, scope);
            }
        } catch (error) {
            console.error(
                `[ERROR] [SCANNER] Erro ao registrar serviço ${serviceClass.name}:`,
                error
            );
        }
    }
}

/**
 * Registra todos os processadores no container de DI
 * Processadores são componentes especiais marcados com @Processor
 * que executam lógica de processamento específica
 *
 * @private
 */
async function registerProcessors(): Promise<void> {
    const sufixProcessors =
        metadataRegistry.processors.size > 1 ? `processadores` : "processador";
    console.log(
        `[INFO] [SCANNER] Registrando ${metadataRegistry.processors.size} ${sufixProcessors}...`
    );

    for (const processorClass of metadataRegistry.processors) {
        try {
            const scope = getProcessorScope(processorClass);

            GlobalContainer.register(processorClass, {
                useClass: processorClass,
                scope,
            });

            // Se for singleton, aplicar lifecycle imediatamente
            if (scope === "singleton") {
                const instance = GlobalContainer.resolve(processorClass);
                applyLifecycle(instance, scope);
            }
        } catch (error) {
            console.error(
                `❌ Erro ao registrar processador ${processorClass.name}:`,
                error
            );
        }
    }
}

/**
 * Registra todos os controladores HTTP no container de DI
 * Controladores são classes marcadas com @Controller e
 * são responsáveis por lidar com requisições HTTP
 *
 * @private
 */
async function registerControllers(): Promise<void> {
    const sufixControllers =
        metadataRegistry.controllers.size > 1 ? `controladores` : "controlador";
    console.log(
        `[INFO] [SCANNER] Registrando ${metadataRegistry.controllers.size} ${sufixControllers}...`
    );

    for (const controllerClass of metadataRegistry.controllers) {
        try {
            // Controllers são sempre singleton por padrão
            const scope: LifeCycleOpt =
                Reflect.getMetadata("service:scope", controllerClass) ??
                "singleton";

            GlobalContainer.register(controllerClass, {
                useClass: controllerClass,
                scope,
            });

            // Se for singleton, aplicar lifecycle imediatamente
            if (scope === "singleton") {
                const instance = GlobalContainer.resolve(controllerClass);
                applyLifecycle(instance, scope);
            }
        } catch (error) {
            console.error(
                `❌ Erro ao registrar controlador ${controllerClass.name}:`,
                error
            );
        }
    }
}

/**
 * Registra a classe principal da aplicação
 * A aplicação é marcada com @Application e representa
 * o ponto de entrada principal do sistema
 *
 * @private
 */
async function registerApplication(): Promise<void> {
    if (metadataRegistry.application) {
        const AppClass = metadataRegistry.application;
        console.log(`[INFO] [SCANNER] Registrando aplicação: ${AppClass.name}`);

        try {
            GlobalContainer.register(AppClass, {
                useClass: AppClass,
                scope: "singleton",
            });

            const appInstance = GlobalContainer.resolve(AppClass);
            applyLifecycle(appInstance, "singleton");
        } catch (error) {
            console.error(
                `❌ Erro ao registrar aplicação ${AppClass.name}:`,
                error
            );
        }
    }
}
