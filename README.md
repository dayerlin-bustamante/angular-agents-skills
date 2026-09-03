# Angular AI

> AI-agnostic Angular agents and skills for any coding tool.

Install production-ready Angular knowledge into your AI coding agent. Agents and skills are defined once and installed into OpenCode, Claude Code, Codex, or any future tool.

---

## Architecture

```
angular-agent-skills/
├── agents/                    # Universal agent definitions
│   ├── angular-architect/
│   │   ├── agent.yaml         # Metadata (name, description, triggers, skills)
│   │   └── agent.md           # Instructions (pure markdown)
│   ├── angular-migrator/
│   │   ├── agent.yaml
│   │   └── agent.md
│   └── angular-reviewer/
│       ├── agent.yaml
│       └── agent.md
├── adapters/                  # AI-specific format converters
│   ├── opencode.ts
│   ├── claude.ts
│   └── codex.ts
├── skills/                    # Reusable Angular knowledge
│   ├── architecture/
│   ├── components/
│   ├── libraries/
│   ├── performance/
│   ├── quality/
│   └── reactivity/
├── src/                       # CLI and core logic
│   ├── cli.ts
│   ├── registry.ts
│   ├── types.ts
│   └── index.ts
└── tests/                     # Test suite
```

### Universal Agent Format

Each agent is a directory with two files:

- **`agent.yaml`** — Universal metadata (name, description, triggers, skills)
- **`agent.md`** — Pure markdown instructions (no frontmatter, no tool-specific syntax)

This is the single source of truth. Agents never depend on any specific AI tool.

### Adapters

Adapters transform universal agents into tool-specific formats:

| Adapter | Output Format | Install Path |
|---|---|---|
| `opencode` | Markdown + YAML frontmatter | `.opencode/agents/` |
| `claude` | Markdown + YAML frontmatter | `.claude/agents/` |
| `codex` | TOML | `.codex/agents/` |

Adding a new AI tool requires only creating a new adapter file — no changes to agents or core logic.

---

## Installation

### As CLI

```bash
npm install -g angular-ai
```

### As dependency

```bash
npm install angular-ai
```

---

## Usage

### Install an agent

```bash
# For OpenCode
npx angular-ai install agent angular-architect --ai opencode

# For Claude Code
npx angular-ai install agent angular-architect --ai claude

# For Codex
npx angular-ai install agent angular-architect --ai codex
```

### Install for all tools

```bash
npx angular-ai install agent angular-architect --all
```

### Custom target directory

```bash
npx angular-ai install agent angular-architect \
  --ai opencode \
  --agent ./my-agents
```

### List available agents

```bash
npx angular-ai list agents
```

### List available adapters

```bash
npx angular-ai list adapters
```

---

## Agents

| Agent | Purpose | Triggers |
|---|---|---|
| `angular-architect` | Generate components, services, libraries | create component, generar, scaffold |
| `angular-migrator` | Migrate legacy code to modern patterns | migrate, migrar, convert to signals |
| `angular-reviewer` | Review code for best practices | review, revisar, code review |

---

## Skills

Skills are reusable knowledge modules that agents reference:

| Category | Skills |
|---|---|
| **Architecture** | injection-tokens, overlay-animation-lifecycle |
| **Components** | dynamic-components, modern-host-bindings, content-projection-ng, viewchild-contentchild-signals |
| **Libraries** | standalone-component-library, monorepo-ng-packagr, library-versioning |
| **Performance** | defer-blocks, control-flow-syntax |
| **Quality** | pr-reviewer, vitest-angular-components |
| **Reactivity** | signals-state-management, signals-inputs-outputs, signals-effects |

---

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type check
npm run lint
```

---

## Adding a New Adapter

1. Create `adapters/my-tool.ts`:
```typescript
import type { Adapter, AdapterOutput, InstallOptions, UniversalAgent } from '../src/types.js';

export const myToolAdapter: Adapter = {
  name: 'my-tool',
  description: 'My AI Tool',
  defaultDir: '.my-tool/agents',

  generate(agent: UniversalAgent): AdapterOutput {
    // Transform agent to tool-specific format
    return {
      filename: `${agent.metadata.name}.ext`,
      content: `...`,
    };
  },

  getInstallPath(options: InstallOptions): string {
    const base = options.targetDir || this.defaultDir;
    return `${base}/${options.agentName}.ext`;
  },
};
```

2. Register in `src/cli.ts`:
```typescript
import { myToolAdapter } from '../adapters/my-tool.js';
registerAdapter(myToolAdapter);
```

3. Done. The CLI now supports `--ai my-tool`.

---

## License

MIT
