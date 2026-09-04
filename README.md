# angular-agents-skills

> Instala conocimiento Angular production-ready en tu agente de AI coding.

Agents y skills definidos una sola vez, instalados en OpenCode, Claude Code, Codex, Cursor, Copilot o cualquier herramienta futura. Sin duplicar configuración. Sin depender de un vendor.

---

## Architecture

```
angular-agents-skills/
├── agents/                          # Definiciones universales de agents
│   ├── angular-architect/
│   │   ├── agent.md                 # Instrucciones (markdown puro)
│   │   └── configs/                 # Configuración por herramienta AI
│   │       ├── opencode.yaml
│   │       ├── claude.yaml
│   │       ├── codex.yaml
│   │       ├── cursor.yaml
│   │       └── copilot.yaml
│   ├── angular-migrator/
│   │   ├── agent.md
│   │   └── configs/
│   └── angular-reviewer/
│       ├── agent.md
│       └── configs/
├── skills/                          # Conocimiento Angular reutilizable
│   ├── architecture/
│   ├── components/
│   ├── libraries/
│   ├── performance/
│   ├── quality/
│   └── reactivity/
├── adapters/                        # Conversores de formato por herramienta
│   ├── opencode/
│   ├── claude/
│   ├── codex/
│   ├── cursor/
│   └── copilot/
└── src/                             # CLI y lógica core
    ├── cli.ts
    ├── registry.ts
    └── types.ts
```

### Universal Agents

Cada agent es un directorio con un `agent.md` (instrucciones en markdown puro) y un directorio `configs/` con archivos YAML por cada herramienta AI. Esta es la fuente de verdad. Los agents nunca dependen de ninguna herramienta específica.

### Skills

Skills son módulos de conocimiento Angular reutilizables. Cada skill es un `SKILL.md` dentro de una categoría. Los agents referencian los skills relevantes para ejecutar sus tareas.

### Adapters

Adapters transforman agents universales al formato específico de cada herramienta:

| Adapter | Formato de Salida | Path de Instalación |
|---|---|---|
| `opencode` | Markdown + YAML frontmatter | `.opencode/agents/` |
| `claude` | Markdown + YAML frontmatter | `.claude/agents/` |
| `codex` | TOML | `.codex/agents/` |
| `cursor` | MDC (Markdown Custom) | `.cursor/rules/` |
| `copilot` | Markdown con header | `.github/` |

Agregar una nueva herramienta AI solo requiere crear un nuevo archivo adapter — sin modificar agents ni la lógica core.

---

## Installation

### CLI Global

```bash
npm install -g angular-agents-skills
```

### Como dependencia del proyecto

```bash
npm install angular-agents-skills
```

### Node.js >= 18.0.0 requerido

---

## Usage

### Instalar un agent para una herramienta

```bash
# OpenCode
npx angular-agents-skills agent angular-architect --ai opencode

# Claude Code
npx angular-agents-skills agent angular-architect --ai claude

# Codex
npx angular-agents-skills agent angular-architect --ai codex

# Cursor
npx angular-agents-skills agent angular-architect --ai cursor

# Copilot
npx angular-agents-skills agent angular-architect --ai copilot
```

### Instalar un agent para todas las herramientas

```bash
npx angular-agents-skills agent angular-architect --all
```

### Instalar una skill

```bash
npx angular-agents-skills skill signals-state-management --ai opencode
npx angular-agents-skills skill defer-blocks --all
```

### Directorio personalizado

```bash
npx angular-agents-skills agent angular-architect --ai opencode --target ./my-agents
npx angular-agents-skills skill signals-effects --ai claude --target ./my-skills
```

### Listar recursos disponibles

```bash
npx angular-agents-skills list agents
npx angular-agents-skills list skills
npx angular-agents-skills list adapters
```

---

## Available Agents

| Agent | Descripción | Triggers |
|---|---|---|
| `angular-architect` | Genera componentes, servicios y libraries siguiendo convenciones del proyecto y mejores prácticas. Usa signal-based inputs/outputs, standalone components, functional inject(). | create component, generar, scaffold, crear servicio, nueva library |
| `angular-migrator` | Migra código Angular legacy a patrones modernos: template syntax (@if/@for/@switch), signals, standalone components, host bindings. Respeta funcionalidad existente. | migrate, migrar, convertir a signals, modernizar, upgrade |
| `angular-reviewer` | Revisa PRs y código contra una checklist de performance, reactivity, arquitectura y testing. Genera reporte estructurado con blockers y sugerencias. | review, revisar, code review, PR review, check |

---

## Available Skills

### Architecture

| Skill | Descripción |
|---|---|
| `injection-tokens` | Define y consume `InjectionToken`s tipados para configuración y patrones adapter/strategy |
| `overlay-animation-lifecycle` | Coordina animaciones CSS de enter/leave para overlays (modal, popover, toast) sin Angular animations |

### Components

| Skill | Descripción |
|---|---|
| `dynamic-components` | Crea y monta componentes dinámicamente en runtime con `createComponent()` y `ApplicationRef` |
| `modern-host-bindings` | Bindings dinámicos de clases, atributos y ARIA via objeto `host` en `@Component` |
| `content-projection-ng` | Proyección de contenido con `ng-content`, `select` y `ngProjectAs` (slots nombrados y multi-slot) |
| `viewchild-contentchild-signals` | Query de view/content children con funciones signal-based: `viewChild()`, `contentChild()`, `contentChildren()` |

### Libraries

| Skill | Descripción |
|---|---|
| `standalone-component-library` | Scaffold de library Angular standalone con ng-packagr, barrel exports y SCSS |
| `monorepo-ng-packagr` | Estructura y operación de monorepo multi-library con ng-packagr, path aliases y scripts |
| `library-versioning` | Actualización de versiones de libraries y manejo de peer dependencies |

### Performance

| Skill | Descripción |
|---|---|
| `defer-blocks` | Lazy-load de secciones de template con `@defer`, triggers (viewport, idle, interaction), placeholder, loading, error |
| `control-flow-syntax` | Control flow nativo del template: `@if`, `@for` (con `track`), `@switch` en vez de directivas estructurales |

### Quality

| Skill | Descripción |
|---|---|
| `pr-reviewer` | Review de Pull Requests usando Azure DevOps MCP con reporte estructurado |
| `vitest-angular-components` | Configuración y tests de componentes standalone con Vitest browser mode + Playwright |

### Reactivity

| Skill | Descripción |
|---|---|
| `signals-state-management` | Gestión de estado local con `signal()`, `computed()` y `linkedSignal()` |
| `signals-inputs-outputs` | Migración de `@Input()`/`@Output()` a APIs signal-based: `input()`, `output()`, `model()` |
| `signals-effects` | Uso correcto de `effect()` y `afterRenderEffect()` para side effects reactivos |

---

## Supported AI Tools

| Tool | Formato | Path por Defecto | Notas |
|---|---|---|---|
| **OpenCode** | Markdown + YAML frontmatter | `.opencode/agents/` | Soporta `mode` y `permission` en frontmatter |
| **Claude Code** | Markdown + YAML frontmatter | `.claude/agents/` | Soporta `tools` en frontmatter |
| **Codex** | TOML | `.codex/agents/` | Instrucciones escapadas en `developer_instructions` |
| **Cursor** | MDC (Markdown Custom) | `.cursor/rules/` | Incluye `alwaysApply: false` en frontmatter |
| **GitHub Copilot** | Markdown | `.github/` | Archivo nombrado `copilot-instructions-<agent>.md` |

### Agregar una nueva herramienta AI

1. Crear `adapters/my-tool/index.ts` implementando la interfaz `Adapter`
2. Registrar en `src/cli.ts` con `registerAdapter(createMyToolAdapter())`
3. Listo. La CLI ahora soporta `--ai my-tool`

---

## Development & Contributing

### Setup

```bash
# Instalar dependencias
npm install

# Build
npm run build

# Watch (dev)
npm run dev

# Tests
npm test

# Tests en watch mode
npm run test:watch

# Type check
npm run lint
```

### Adding a new Agent

1. Crear directorio `agents/<agent-name>/`
2. Agregar `agent.md` con instrucciones en markdown puro (sin frontmatter, sin sintaxis de herramienta específica)
3. Crear `configs/` con un YAML por cada herramienta AI soportada:

```yaml
# agents/my-agent/configs/opencode.yaml
name: my-agent
description: Descripción del agent
mode: subagent
permission:
  edit: allow
  bash: ask
```

### Adding a new Skill

1. Crear directorio `skills/<category>/<skill-name>/`
2. Agregar `SKILL.md` con metadata YAML al inicio y contenido en markdown

### Adding a new Adapter

```typescript
import type { Adapter, AdapterOutput, UniversalAgent } from '../../src/types.js';

export function createMyToolAdapter(): Adapter {
  return {
    name: 'my-tool',
    description: 'My AI Tool',
    defaultDir: '.my-tool/agents',
    extension: 'md',

    generate(agent: UniversalAgent, config?: Record<string, unknown>): AdapterOutput {
      return {
        filename: `${agent.metadata.name}.md`,
        content: `---\ndescription: ${agent.metadata.description}\n---\n\n${agent.instructions.content}`,
      };
    },

    getInstallPath(name: string, targetDir?: string): string {
      const base = targetDir || this.defaultDir;
      return `${base}/${name}.${this.extension}`;
    },
  };
}
```

Registrar en `src/cli.ts`:

```typescript
import { createMyToolAdapter } from '../adapters/my-tool/index.js';
registerAdapter(createMyToolAdapter());
```

---

## License

MIT
