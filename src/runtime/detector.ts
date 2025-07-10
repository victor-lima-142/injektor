/**
 * Detecta o runtime atual (Bun, Node.js, Deno, Browser)
 */

export type Runtime = 'bun' | 'node' | 'deno' | 'browser' | 'unknown';

/**
 * Detecta o runtime atual baseado nas variáveis globais disponíveis
 * @returns O runtime detectado
 */
export function detectRuntime(): Runtime {
    // Verificar se estamos no navegador
    if (typeof (globalThis as any).window !== 'undefined' && typeof (globalThis as any).document !== 'undefined') {
        return 'browser';
    }
    
    // Verificar se estamos no Bun
    if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
        return 'bun';
    }
    
    // Verificar se estamos no Deno
    if (typeof globalThis !== 'undefined' && 'Deno' in globalThis) {
        return 'deno';
    }
    
    // Verificar se estamos no Node.js
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
        return 'node';
    }
    
    return 'unknown';
}

/**
 * Verifica se o runtime atual é o Bun
 * @returns true se for Bun
 */
export function isBun(): boolean {
    return detectRuntime() === 'bun';
}

/**
 * Verifica se o runtime atual é o Node.js
 * @returns true se for Node.js
 */
export function isNode(): boolean {
    return detectRuntime() === 'node';
}

/**
 * Verifica se o runtime atual é o Deno
 * @returns true se for Deno
 */
export function isDeno(): boolean {
    return detectRuntime() === 'deno';
}

/**
 * Verifica se o runtime atual é um navegador
 * @returns true se for um navegador
 */
export function isBrowser(): boolean {
    return detectRuntime() === 'browser';
}

/**
 * Obtém informações sobre o runtime atual
 * @returns Objeto com informações do runtime
 */
export function getRuntimeInfo() {
    const runtime = detectRuntime();
    
    let version = 'unknown';
    let platform = 'unknown';
    
    switch (runtime) {
        case 'bun':
            // @ts-ignore - Bun specific
            version = globalThis.Bun?.version || 'unknown';
            platform = process.platform || 'unknown';
            break;
            
        case 'node':
            version = process.versions.node;
            platform = process.platform;
            break;
            
        case 'deno':
            // @ts-ignore - Deno specific
            version = globalThis.Deno?.version?.deno || 'unknown';
            // @ts-ignore - Deno specific  
            platform = globalThis.Deno?.build?.os || 'unknown';
            break;
            
        case 'browser':
            version = (globalThis as any).navigator?.userAgent || 'unknown';
            platform = 'browser';
            break;
    }
    
    return {
        runtime,
        version,
        platform,
        supportsESM: runtime !== 'unknown',
        supportsCJS: runtime === 'node' || runtime === 'bun',
        supportsTopLevelAwait: runtime !== 'unknown'
    };
} 