import { defineConfig, type Options } from 'tsup';

export default defineConfig({
    // Pontos de entrada
    entry: {
        index: 'src/index.ts',
        'runtime/index': 'src/runtime/index.ts',
        // Incluir arquivos da demo
        'demo/main': 'demo/main.ts',
        'demo/service': 'demo/service.ts',
        'demo/controller': 'demo/controller.ts',
        'demo/config/config': 'demo/config/config.ts',
        'demo/config/logger': 'demo/config/logger.ts'
    },
    
    // Formatos de saída
    format: ['esm', 'cjs'],
    
    // Gerar arquivos de definição TypeScript
    dts: true,
    
    // Limpar pasta dist antes do build
    clean: true,
    
    // Código splitting para otimização
    splitting: true,
    
    // Sourcemaps para debug
    sourcemap: true,
    
    // Minificar em produção
    minify: process.env.NODE_ENV === 'production',
    
    // Target para compatibilidade
    target: 'node16',
    
    // Configurações específicas
    platform: 'neutral', // Para funcionar em diferentes runtimes
    
    // Preservar metadados de decorators
    keepNames: true,
    
    // Configurações para CJS
    cjsInterop: true,
    
    // Excluir dependências externas do bundle
    external: [
        'express',
        'fastify', 
        'reflect-metadata',
        'fs',
        'path',
        'url'
    ],
    
    // Banner para indicar que precisa do reflect-metadata
    banner: {
        js: `/**
 * @injektor/infuse - Framework de Injeção de Dependências
 * 
 * IMPORTANTE: Certifique-se de importar 'reflect-metadata' antes de usar este framework:
 * 
 * import 'reflect-metadata';
 * import { Application, Service, Controller } from '@injektor/infuse';
 * 
 * Multi-runtime: Funciona com Bun, Node.js e Deno
 */`
    },
    
    // Configuração para diferentes ambientes
    env: {
        NODE_ENV: process.env.NODE_ENV || 'development'
    },
    
    // Configurações do TypeScript
    tsconfig: './tsconfig.build.json',
    
    // Plugin customizado para manter compatibilidade
    plugins: [],
    
    // Output extensions serão determinadas automaticamente pelo tsup
    
    // Configurações de dev
    watch: process.env.NODE_ENV === 'development',
    
    // Configurações avançadas
    replaceNodeEnv: true,
    
    // Logs mais detalhados
    silent: false
}); 