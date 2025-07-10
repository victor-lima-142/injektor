import { readdirSync, statSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { pathToFileURL } from "../runtime/url";

/**
 * Verifica se a URL fornecida representa um arquivo
 * @param fileUrl - URL do arquivo a ser verificada
 * @returns true se for um arquivo, false caso contrário
 *
 * @example
 * ```typescript
 * const isFile = isFileUrl('file:///path/to/file.ts');
 * console.log(isFile); // true ou false
 * ```
 */
export function isFileUrl(fileUrl: string): boolean {
    const filePath = fileURLToPath(`file:///${fileUrl}`);
    const stats = statSync(filePath);
    return stats.isFile();
}

/**
 * Retorna o diretório base (root folder) do arquivo se for um arquivo,
 * ou o próprio diretório se for uma pasta
 * @param fileUrl - URL do arquivo ou diretório
 * @returns Caminho do diretório base
 *
 * @example
 * ```typescript
 * const rootDir = getRootFolderFromUrl('file:///path/to/file.ts');
 * // Retorna '/path/to' se for um arquivo
 * // Retorna '/path/to/dir' se for um diretório
 * ```
 */
export function getRootFolderFromUrl(fileUrl: string): string {
    const filePath = fileURLToPath(fileUrl);
    const stats = statSync(filePath);

    return stats.isFile() ? dirname(filePath) : filePath;
}

/**
 * Carrega todos os módulos de um diretório de forma recursiva
 * Importa dinamicamente todos os arquivos encontrados no diretório
 *
 * @param dir - Caminho do diretório a ser escaneado
 *
 * @example
 * ```typescript
 * // Carregar todos os módulos de um diretório
 * await loadModulesFrom('./src/controllers');
 *
 * // Carregar de um arquivo específico (carrega o diretório pai)
 * await loadModulesFrom('./src/app.ts');
 * ```
 */
export async function loadModulesFrom(dir: string) {
    const isFile = isFileUrl(dir);
    if (isFile) {
        dir = getRootFolderFromUrl(dir);
    }
    dir = getLatestPath(dir);
    const absoluteDir = resolve(process.cwd(), dir);
    const files = getAllFilesRecursively(absoluteDir);

    for (const file of files) {
        const fileUrl = pathToFileURL(file).href;
        await import(fileUrl);
    }
}

/**
 * Extrai a última parte do caminho fornecido
 * @param path - Caminho completo
 * @returns Última parte do caminho
 * @throws {Error} Se a última parte do caminho for undefined
 * @private
 */
const getLatestPath = (path: string): string => {
    const parts = path.split("/");
    const lastPart = parts[parts.length - 1];
    if (!lastPart)
        throw new Error("Erro ao carregar módulos: lastPart is undefined");
    return lastPart;
};

/**
 * Obtém todos os arquivos de um diretório de forma recursiva
 * Filtra apenas arquivos .ts ou .js dependendo do ambiente
 * @param dirPath - Caminho do diretório a ser escaneado
 * @returns Array com todos os caminhos de arquivos encontrados
 * @private
 *
 * @example
 * ```typescript
 * const files = getAllFilesRecursively('./src');
 * console.log(files); // ['./src/app.ts', './src/controllers/user.ts', ...] ou ['./dist/app.js', ...]
 * ```
 */
function getAllFilesRecursively(dirPath: string): string[] {
    const entries = readdirSync(dirPath);
    console.log(`[DEBUG] [LOADER] Escaneando diretório: ${dirPath}`);

    return entries.flatMap((entry) => {
        const fullPath = join(dirPath, entry);
        const stats = statSync(fullPath);
        if (stats.isDirectory()) {
            return getAllFilesRecursively(fullPath);
        } else {
            // Verificar se estamos em ambiente compilado (dist) ou desenvolvimento (src)
            const isCompiledEnvironment = dirPath.includes('dist') || fullPath.includes('dist');
            const isValidFile = isCompiledEnvironment 
                ? fullPath.endsWith('.js') && !fullPath.endsWith('.map')
                : fullPath.endsWith('.ts');
                
            console.log(`[DEBUG] [LOADER] Arquivo: ${fullPath}, Compilado: ${isCompiledEnvironment}, Válido: ${isValidFile}`);
            return isValidFile ? [fullPath] : [];
        }
    });
}
