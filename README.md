# @injektor/infuse

## Tipos de Ciclo de Vida

O framework agora suporta três tipos de ciclo de vida mais robustos:

### 1. **Singleton** (Padrão)

- Uma única instância compartilhada em toda a aplicação
- Criada na inicialização e reutilizada sempre
- Ideal para serviços stateless, configurações, etc.

### 2. **Transient**

- Nova instância criada a cada resolução
- Não há cache ou reutilização
- Ideal para objetos temporários, processadores de dados

### 3. **Request**

- Uma instância por requisição HTTP
- Instância é compartilhada dentro do contexto da mesma requisição
- Automaticamente limpa no final da requisição
- Ideal para contextos de usuário, dados temporários da requisição

## Definindo Tipos

```typescript
// Tipos básicos
export type LifeCycleOpt = "singleton" | "transient" | "request";

// Tipos específicos com documentação
export interface LifeCycleSingleton {
    scope: "singleton";
    /** Instância única compartilhada em toda a aplicação */
}

export interface LifeCycleTransient {
    scope: "transient";
    /** Nova instância a cada resolução */
}

export interface LifeCycleRequest {
    scope: "request";
    /** Uma instância por requisição HTTP */
}
```

## Usando com Decoradores

### @Service

```typescript
// Singleton (padrão)
@Service()
export class DatabaseService {
    // Uma instância compartilhada
}

// Transient
@Service({ scope: "transient" })
export class EmailSender {
    // Nova instância a cada uso
}

// Request
@Service({ scope: "request" })
export class UserContext {
    // Uma instância por requisição HTTP
}

// Usando configuração detalhada
@Service({ 
    lifecycle: { scope: "singleton" }
})
export class ConfigService {
    // Singleton com configuração explícita
}
```

### @Processor

```typescript
// Singleton (padrão)
@Processor()
export class DataProcessor {
    // Processador compartilhado
}

// Transient para processamento isolado
@Processor({ scope: "transient" })
export class BatchProcessor {
    // Nova instância para cada lote
}

// Request para processamento contextual
@Processor({ 
    lifecycle: { scope: "request" }
})
export class RequestProcessor {
    // Uma instância por requisição
}
```

## Interfaces de Ciclo de Vida

### LifeCycleAware

Para componentes que precisam de inicialização/limpeza:

```typescript
import { LifeCycleAware } from "../core/life-cycle";

@Service()
export class MyService implements LifeCycleAware {
    onInit() {
        console.log("Serviço inicializado");
        // Configuração inicial
    }

    onDestroy() {
        console.log("Serviço sendo destruído");
        // Limpeza de recursos
    }
}
```

### RequestLifeCycleAware

Para componentes de escopo request:

```typescript
import { RequestLifeCycleAware } from "../core/life-cycle";

@Service({ scope: "request" })
export class RequestService implements RequestLifeCycleAware {
    private requestId?: string;

    onInit() {
        console.log("Serviço request inicializado");
    }

    onRequestStart(requestId: string) {
        this.requestId = requestId;
        console.log(`Requisição ${requestId} iniciada`);
    }

    onRequestEnd() {
        console.log(`Requisição ${this.requestId} finalizando`);
        // Limpeza específica da requisição
    }

    onDestroy() {
        console.log("Serviço sendo destruído");
    }
}
```

## Container e Resolução

O container agora suporta requestId para escopos request:

```typescript
// Singleton - sem requestId
const service1 = GlobalContainer.resolve(MyService);

// Request - com requestId
const service2 = GlobalContainer.resolve(RequestService, "req_123");

// Transient - nova instância sempre
const service3 = GlobalContainer.resolve(TransientService);
```

## Gerenciamento Automático

### Para Controllers

O framework automaticamente:

- Gera um requestId único para cada requisição HTTP
- Resolve dependências com o escopo correto
- Aplica ciclo de vida adequado
- Limpa instâncias request no final

### Para Cleanup

```typescript
// Limpeza específica de requisição
await cleanupRequest(requestId);

// Limpeza de transients
await cleanupTransient();

// Shutdown completo da aplicação
await shutdown();
```

## Exemplo Prático

```typescript
// services.ts
@Service() // singleton
export class DatabaseService {
    connect() { /* ... */ }
}

@Service({ scope: "request" })
export class UserContext implements RequestLifeCycleAware {
    private user?: User;
    
    onRequestStart(requestId: string) {
        // Carregar contexto do usuário para esta requisição
    }
    
    onRequestEnd() {
        // Limpar dados sensíveis
        this.user = undefined;
    }
}

@Service({ scope: "transient" })
export class EmailSender {
    // Nova instância para cada email
    send(email: Email) { /* ... */ }
}

// controller.ts
@Controller("/api")
export class UserController {
    constructor(
        private db: DatabaseService,     // singleton - mesma instância
        private context: UserContext,    // request - uma por requisição
        private emailSender: EmailSender // transient - nova a cada resolução
    ) {}

    @Get("/profile")
    getProfile() {
        // db: sempre a mesma instância
        // context: única para esta requisição
        // emailSender: nova instância se injetada novamente
    }
}
```

## Estatísticas e Monitoramento

```typescript
// Obter estatísticas do container
const stats = GlobalContainer.getStats();
console.log(stats);
// { providers: 10, singletons: 5, activeRequests: 3 }

// Obter estatísticas do ciclo de vida
const lifecycle = getLifecycleStats();
console.log(lifecycle);
// { singletons: 5, transients: 2, activeRequests: 3, requestInstances: 8 }
```

## Resolução de Problemas de Inicialização

O framework agora possui um sistema robusto para lidar com problemas de inicialização de dependências, incluindo:

### Problema: "Cannot access before initialization"

Este erro ocorre quando uma classe referencia outra que ainda não foi completamente definida pelo JavaScript engine.

```typescript
// ❌ PROBLEMA: ExampleService não foi definida ainda
@Service()
export class DependentService {
    constructor(private example: ExampleService) {} // ReferenceError!
}

@Service()
export class ExampleService {
    getMessage() { return "Hello"; }
}
```

### Soluções Automáticas

#### 1. Resolução Diferida (Automática)

O container automaticamente detecta erros de inicialização e tenta resolver as dependências após um breve delay:

```typescript
// O sistema detecta o erro e tenta novamente até 3 vezes
const stats = GlobalContainer.getStats();
console.log(`Dependências pendentes: ${stats.pendingResolutions}`);

// Verificar dependências pendentes
const pending = GlobalContainer.getPendingResolutions();
console.log(pending);
```

#### 2. Detecção de Dependências Circulares

```typescript
// O sistema detecta automaticamente e reporta loops infinitos
@Service()
export class ServiceA {
    constructor(private serviceB: ServiceB) {}
}

@Service()
export class ServiceB {
    constructor(private serviceA: ServiceA) {} // Erro: Dependência circular!
}
```

### Soluções Manuais

#### 1. Reorganizar Ordem de Declaração

```typescript
// ✅ SOLUÇÃO: Declarar dependências primeiro
@Service()
export class ExampleService {
    getMessage() { return "Hello"; }
}

@Service()
export class DependentService {
    constructor(private example: ExampleService) {} // Agora funciona!
}
```

#### 2. Usar Tokens de Injeção

```typescript
// Definir token para evitar referência direta
export const EXAMPLE_SERVICE = Symbol('ExampleService');

@Service()
export class ExampleService {
    getMessage() { return "Hello"; }
}

// Registrar com token
GlobalContainer.register(EXAMPLE_SERVICE, { 
    useClass: ExampleService, 
    scope: 'singleton' 
});

@Service()
export class DependentService {
    constructor(@Inject(EXAMPLE_SERVICE) private example: ExampleService) {}
}
```

### Ferramentas de Debugging

#### Diagnóstico Automático

```typescript
import { diagnosticarProblemasInicializacao, configurarModoDebug } from './demo/initialization-example';

// Diagnosticar problemas
diagnosticarProblemasInicializacao();

// Configurar modo strict (falhas imediatas) vs lenient (resolução diferida)
configurarModoDebug('strict');  // Para debugging
configurarModoDebug('lenient'); // Para produção (padrão)
```

#### Forçar Resolução de Dependências

```typescript
// Após registrar todas as dependências, forçar resolução
await GlobalContainer.resolvePendingDependencies();

// Verificar se ainda há dependências pendentes
const stats = GlobalContainer.getStats();
if (stats.pendingResolutions > 0) {
    console.warn('Ainda há dependências não resolvidas');
}
```

#### Monitoramento em Tempo Real

```typescript
// Durante o desenvolvimento, monitore tentativas de resolução
GlobalContainer.setDeferredResolution(true); // Habilitar resolução diferida

// Após scanear componentes
await scanAndRegister();

// Verificar se houve problemas
const pending = GlobalContainer.getPendingResolutions();
if (pending.length > 0) {
    console.log('Dependências que precisam de atenção:', pending);
}
```

### Exemplo Prático de Debugging

```typescript
import { demonstrarResolucaoInicializacao } from './demo/initialization-example';

// Executar demonstração completa do sistema de inicialização
demonstrarResolucaoInicializacao()
    .then(() => console.log('✅ Sistema funcionando corretamente'))
    .catch(error => console.error('❌ Problemas encontrados:', error));
```

## Melhores Práticas

1. **Use Singleton** para serviços stateless, configurações, conexões de DB
2. **Use Transient** para objetos temporários, processadores de dados
3. **Use Request** para contextos de usuário, cache temporário por requisição
4. **Implemente LifeCycleAware** para recursos que precisam de limpeza
5. **Use RequestLifeCycleAware** apenas para serviços request-scoped
6. **Monitore** estatísticas em produção para detectar vazamentos
7. **Declare dependências** na ordem correta (sem dependências primeiro)
8. **Use tokens** para evitar dependências circulares complexas
9. **Mantenha resolução diferida habilitada** em produção
10. **Execute diagnostics** durante desenvolvimento para detectar problemas
