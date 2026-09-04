# angular-agents-skills

[![npm version](https://img.shields.io/npm/v/angular-agents-skills.svg)](https://www.npmjs.com/package/angular-agents-skills)
[![license](https://img.shields.io/npm/l/angular-agents-skills.svg)](https://github.com/)

> Instala conocimiento Angular production-ready como archivos `.md` / `.mdc` directamente en tu herramienta de AI.

Configura una sola vez y distribuye a **Cursor**, **Claude Code**, **OpenCode**, **Copilot** o **Codex** sin dependencias en tu proyecto.

---

## ⚡ Quick Start

Ejecuta directamente con `npx` (sin instalación previa):

```bash
# Ver catálogo disponible
npx angular-ai list agents
npx angular-ai list skills

# Instalar un agente (ej. Cursor)
npx angular-ai agent angular-architect --ai cursor

# Instalar una skill (ej. Claude Code)
npx angular-ai skill signals-state-management --ai claude
```

## 🎯 Supported AI Tools & Destinations

| Herramienta | `--ai` | Formato | Ruta por Defecto |
| :--- | :--- | :--- | :--- |
| **Cursor** | `cursor` | `.mdc` | `.cursor/rules/` |
| **Claude Code** | `claude` | `.md` | `.claude/agents/` |
| **OpenCode** | `opencode` | `.md` | `.opencode/agents/` |
| **Codex** | `codex` | `.toml` | `.codex/agents/` |
| **Copilot** | `copilot` | `.md` | `.github/` |

## 📖 Usage

### Agents

```bash
# Para una herramienta específica
npx angular-ai agent <name> --ai <tool>

# Para todas las herramientas soportadas
npx angular-ai agent <name> --all

# En un directorio personalizado
npx angular-ai agent <name> --ai <tool> --target ./custom-dir
```

## 🤖 Available Agents

| Agent | Descripción | Triggers |
| :--- | :--- | :--- |
| `angular-architect` | Genera componentes, servicios y libraries siguiendo convenciones modernas: Signal inputs/outputs, standalone components e `inject()`. | `create component`, `generar`, `scaffold`, `crear servicio`, `nueva library` |
| `angular-migrator` | Migra código legacy a patrones modernos: `@if`/`@for`, Signals, standalone components y host bindings. | `migrate`, `migrar`, `convertir a signals`, `modernizar`, `upgrade` |
| `angular-reviewer` | Revisa PRs y código contra checklists de performance, reactividad, arquitectura y testing. | `review`, `revisar`, `code review`, `PR review`, `check` |

---

## 💡 Available Skills

### Reactivity
* `signals-state-management`: Gestión de estado reactivo local con `signal()`, `computed()` y `linkedSignal()`.
* `signals-inputs-outputs`: Migración de `@Input()`/`@Output()` a APIs signal-based: `input()`, `output()` y `model()`.
* `signals-effects`: Uso correcto de `effect()` y `afterRenderEffect()` para side effects reactivos.

### Components
* `viewchild-contentchild-signals`: Queries reactivas con `viewChild()`, `contentChild()` y `contentChildren()`.
* `modern-host-bindings`: Enlace de clases, atributos y ARIA vía objeto `host` en `@Component`.
* `content-projection-ng`: Proyección avanzada con `ng-content`, selectores y `ngProjectAs`.
* `dynamic-components`: Creación e instanciación dinámica en runtime con `createComponent()` y `ApplicationRef`.

### Performance & Flow
* `control-flow-syntax`: Control flow nativo del template: `@if`, `@for` (con `track`) y `@switch`.
* `defer-blocks`: Lazy-loading granular con `@defer` y sus triggers (`viewport`, `idle`, `interaction`, `timer`).

### Quality & Architecture
* `pr-reviewer`: Review automatizado de Pull Requests con reporte estructurado.
* `vitest-angular-components`: Configuración y tests de componentes standalone con Vitest Browser Mode.
* `injection-tokens`: Definición y consumo de `InjectionToken`s tipados para configuración e inyección funcional.
* `overlay-animation-lifecycle`: Coordinación de ciclo de vida de animaciones CSS de enter/leave para overlays sin Angular animations.

### Libraries
* `standalone-component-library`: Scaffold de library standalone con ng-packagr, barrel exports y SCSS.
* `monorepo-ng-packagr`: Arquitectura y operación de monorepo multi-library con ng-packagr y path aliases.
* `library-versioning`: Manejo de versiones semánticas y control de peer dependencies.

### Crear un nuevo Adapter

Implementa la interfaz `Adapter` en un nuevo archivo:

```typescript
// adapters/my-tool/index.ts
import type { Adapter, AdapterOutput, UniversalAgent } from '../../src/types.js';

export function createMyToolAdapter(): Adapter {
  return {
    name: 'my-tool',
    description: 'Custom AI Assistant',
    defaultDir: '.my-tool/rules',
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

// registralo en cli.ts 

import { createMyToolAdapter } from '../adapters/my-tool/index.js';

registerAdapter(createMyToolAdapter());
```

## 🏗️ Architecture & New Adapters

```bash
angular-agents-skills/
├── agents/    # Markdown puro + configs YAML
├── skills/    # Conocimiento clasificado (SKILL.md)
├── adapters/  # Conversores específicos por AI
└── src/       # CLI y motor de distribución
```

## 💻 Development
### Instalar dependencias
npm install

### Compilar TypeScript
npm run build

### Modo watch durante desarrollo
npm run dev

### Ejecutar tests
npm test

### Probar la CLI localmente sin publicar
node dist/src/cli.js list skills
node dist/src/cli.js skill defer-blocks --ai cursor

> ## Licence MIT
