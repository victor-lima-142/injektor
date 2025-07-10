/**
 * Abstração para geração de UUIDs que funciona em todos os runtimes
 * Suporta Bun, Node.js e Deno
 */

/**
 * Gera um UUID v4 compatível com todos os runtimes
 * @returns UUID v4 como string
 */
export function generateUUID(): string {
    // Detectar runtime e usar a implementação apropriada
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        // Navegador moderno, Deno, Node.js 14.17+
        return crypto.randomUUID();
    }
    
    // Fallback para runtimes mais antigos
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Gera um UUID v7 (time-based) se disponível, caso contrário fallback para v4
 * @returns UUID como string
 */
export function generateUUIDv7(): string {
    // Se estivermos no Bun e randomUUIDv7 estiver disponível
    if (typeof globalThis !== 'undefined' && 'Bun' in globalThis) {
        try {
            // @ts-ignore - Bun specific
            return (globalThis as any).Bun.randomUUIDv7();
        } catch {
            // Fallback se não conseguir usar o Bun
        }
    }
    
    // Fallback para UUID v4 em outros runtimes
    return generateUUID();
}

/**
 * Gera um ID de requisição único
 * Combina timestamp + UUID para garantir unicidade
 * @returns ID de requisição como string
 */
export function generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const uuid = generateUUID().split('-')[0]; // Pega apenas a primeira parte do UUID
    return `req_${timestamp}_${uuid}`;
} 