/**
 * Abstração para utilitários de URL que funciona em todos os runtimes
 * Suporta Bun, Node.js e Deno
 */

/**
 * Converte um caminho do sistema de arquivos para uma URL file://
 * @param path - Caminho do arquivo
 * @returns URL file:// como string
 */
export function pathToFileURL(path: string): URL {
    // Detectar runtime e usar a implementação apropriada
    if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
        // Bun - usar a implementação nativa
        try {
            // @ts-ignore - Bun specific
            return globalThis.Bun.pathToFileURL(path);
        } catch {
            // Fallback se não conseguir usar o Bun
        }
    }
    
    // Node.js - usar a implementação padrão
    try {
        const { pathToFileURL: nodePathToFileURL } = require('url');
        return nodePathToFileURL(path);
    } catch {
        // Fallback manual se nenhuma implementação estiver disponível
        const normalizedPath = path.replace(/\\/g, '/');
        const urlPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
        return new URL(`file://${urlPath}`);
    }
}

/**
 * Converte uma URL file:// para um caminho do sistema de arquivos
 * @param url - URL file:// como string ou URL object
 * @returns Caminho do arquivo como string
 */
export function fileURLToPath(url: string | URL): string {
    // Detectar runtime e usar a implementação apropriada
    try {
        // Node.js - usar a implementação padrão
        const { fileURLToPath: nodeFileURLToPath } = require('url');
        return nodeFileURLToPath(url);
    } catch {
        // Fallback manual para outros runtimes
        const urlStr = typeof url === 'string' ? url : url.href;
        let path = urlStr.replace(/^file:\/\//, '');
        
        // Handle Windows paths
        if (process.platform === 'win32' && path.match(/^\/[A-Z]:/)) {
            path = path.substring(1);
        }
        
        return path.replace(/\//g, require('path')?.sep || '/');
    }
} 