#!/usr/bin/env bun

import { readdirSync, writeFileSync } from "fs";
import { join } from "path";
import "reflect-metadata";
import { metadataRegistry } from "../src/core";

// Processar argumentos da linha de comando
const args = process.argv.slice(2);

if (!args.length) {
    console.log("❓ Comandos disponíveis:");
    console.log("  list       → Lista módulos decorados");
    console.log("  export     → Gera index.ts com exportações");
    process.exit(0);
}

switch (args[0]) {
    case "list":
        listDecorated();
        break;

    case "export":
        generateIndex(args[1] ?? "demo");
        break;

    default:
        console.error(`❌ Comando desconhecido: ${args[0]}`);
        process.exit(1);
}

/**
 * Lista todos os módulos decorados registrados no metadataRegistry
 * Mostra uma visão geral de todos os componentes descobertos pelo framework
 * 
 * Exibe:
 * - Serviços registrados (@Service)
 * - Configurações registradas (@Configuration)
 * - Controladores registrados (@Controller)
 * 
 * @example
 * ```bash
 * bun run tools/cli.ts list
 * ```
 */
function listDecorated() {
    console.log("🔍 Serviços registrados:", metadataRegistry.services.size);
    for (const s of metadataRegistry.services) {
        console.log("  🛠️  Service:", s.name);
    }

    console.log(
        "📦 Configurações registradas:",
        metadataRegistry.configurations.size
    );
    for (const c of metadataRegistry.configurations) {
        console.log("  ⚙️  Config:", c.name);
    }

    console.log(
        "🌐 Controllers registrados:",
        metadataRegistry.controllers.size
    );
    for (const ctrl of metadataRegistry.controllers) {
        console.log("  📡 Controller:", ctrl.name);
    }
}

/**
 * Gera automaticamente um arquivo index.ts com exportações
 * Escaneia um diretório e cria exportações para todos os arquivos TypeScript
 * 
 * @param dir - Diretório a ser escaneado (padrão: "demo")
 * 
 * @example
 * ```bash
 * # Gera index.ts no diretório demo
 * bun run tools/cli.ts export
 * 
 * # Gera index.ts no diretório src
 * bun run tools/cli.ts export src
 * ```
 */
function generateIndex(dir: string) {
    const dirPath = join(process.cwd(), dir);
    const files = readdirSync(dirPath);

    const tsFiles = files
        .filter(
            (f) => f.endsWith(".ts") && !f.includes(".spec") && f !== "index.ts"
        )
        .map((f) => f.replace(".ts", ""));

    const content = tsFiles
        .map((name) => `export * from './${name}';`)
        .join("\n");

    writeFileSync(join(dirPath, "index.ts"), content);
    console.log(
        `✅ index.ts gerado em ${dir}/index.ts com ${tsFiles.length} arquivos.`
    );
}
