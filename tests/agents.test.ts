import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { registerAdapter, getAdapter, listAdapters, hasAdapter } from '../src/registry.js';
import { createOpenCodeAdapter } from '../adapters/opencode/index.js';
import { createClaudeAdapter } from '../adapters/claude/index.js';
import { createCodexAdapter } from '../adapters/codex/index.js';
import type { UniversalAgent } from '../src/types.js';

const AGENTS_DIR = resolve('agents');
const SKILLS_DIR = resolve('skills');
const TEST_DIR = resolve('.test-output');

function loadTestAgent(name: string): UniversalAgent {
  const agentPath = join(AGENTS_DIR, name);

  if (!existsSync(agentPath)) {
    throw new Error(`Agent "${name}" not found`);
  }

  const mdPath = join(agentPath, 'agent.md');
  const mdContent = readFileSync(mdPath, 'utf-8');
  const description = mdContent.split('\n')[0]?.replace(/^#\s+/, '') || name;

  return {
    metadata: { name, description },
    instructions: { content: mdContent },
    basePath: agentPath,
  };
}

function loadTestAgentConfig(name: string, ai: string): Record<string, unknown> {
  const configPath = join(AGENTS_DIR, name, 'configs', `${ai}.yaml`);
  return parseYaml(readFileSync(configPath, 'utf-8'));
}

beforeEach(() => {
  mkdirSync(TEST_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(TEST_DIR, { recursive: true, force: true });
});

describe('Agent Loading', () => {
  const agentNames = ['angular-architect', 'angular-migrator', 'angular-reviewer'];

  for (const name of agentNames) {
    describe(name, () => {
      it('agent.md exists and is not empty', () => {
        const mdPath = join(AGENTS_DIR, name, 'agent.md');
        assert.ok(existsSync(mdPath), `agent.md not found at ${mdPath}`);

        const content = readFileSync(mdPath, 'utf-8');
        assert.ok(content.length > 0, 'agent.md must not be empty');
        assert.ok(content.startsWith('# '), 'agent.md must start with a heading');
      });

      it('agent.md has no YAML frontmatter', () => {
        const mdPath = join(AGENTS_DIR, name, 'agent.md');
        const content = readFileSync(mdPath, 'utf-8');
        assert.ok(!content.startsWith('---'), 'agent.md must not have YAML frontmatter');
      });

      it('has configs directory with AI configs', () => {
        const configsPath = join(AGENTS_DIR, name, 'configs');
        assert.ok(existsSync(configsPath), 'configs directory must exist');

        for (const ai of ['opencode', 'claude', 'codex']) {
          const configPath = join(configsPath, `${ai}.yaml`);
          assert.ok(existsSync(configPath), `${ai}.yaml must exist`);
        }
      });

      it('loads correctly', () => {
        const agent = loadTestAgent(name);
        assert.equal(agent.metadata.name, name);
        assert.ok(agent.instructions.content.length > 0);
      });
    });
  }
});

describe('Agent Config Loading', () => {
  it('loads opencode config', () => {
    const config = loadTestAgentConfig('angular-architect', 'opencode');
    assert.ok(config.description);
    assert.equal(config.mode, 'subagent');
    assert.ok(config.permission);
  });

  it('loads claude config', () => {
    const config = loadTestAgentConfig('angular-architect', 'claude');
    assert.ok(config.description);
    assert.ok(config.tools);
  });

  it('loads codex config', () => {
    const config = loadTestAgentConfig('angular-architect', 'codex');
    assert.ok(config.description);
  });
});

describe('Skill Loading', () => {
  it('finds skills in skills directory', () => {
    const categories = ['architecture', 'components', 'libraries', 'performance', 'quality', 'reactivity'];

    for (const category of categories) {
      const categoryPath = join(SKILLS_DIR, category);
      assert.ok(existsSync(categoryPath), `Category ${category} must exist`);
    }
  });

  it('loads SKILL.md with frontmatter', () => {
    const skillPath = join(SKILLS_DIR, 'quality', 'pr-reviewer', 'SKILL.md');
    assert.ok(existsSync(skillPath));

    const content = readFileSync(skillPath, 'utf-8').replace(/^\uFEFF/, '');
    assert.ok(content.startsWith('---'), 'SKILL.md must have YAML frontmatter');
    assert.ok(content.includes('name: pr-reviewer'));
    assert.ok(content.includes('description:'));
  });
});

describe('Adapter Registry', () => {
  beforeEach(() => {
    registerAdapter(createOpenCodeAdapter());
    registerAdapter(createClaudeAdapter());
    registerAdapter(createCodexAdapter());
  });

  it('registers all three adapters', () => {
    assert.ok(hasAdapter('opencode'));
    assert.ok(hasAdapter('claude'));
    assert.ok(hasAdapter('codex'));
  });

  it('lists all adapters', () => {
    const names = listAdapters();
    assert.ok(names.includes('opencode'));
    assert.ok(names.includes('claude'));
    assert.ok(names.includes('codex'));
  });

  it('returns undefined for unknown adapter', () => {
    assert.equal(getAdapter('unknown'), undefined);
  });
});

describe('OpenCode Adapter', () => {
  const adapter = createOpenCodeAdapter();
  const agent = loadTestAgent('angular-architect');
  const config = loadTestAgentConfig('angular-architect', 'opencode');

  it('generates correct filename', () => {
    const output = adapter.generate(agent, config);
    assert.equal(output.filename, 'angular-architect.md');
  });

  it('includes frontmatter with description', () => {
    const output = adapter.generate(agent, config);
    assert.ok(output.content.startsWith('---'));
    assert.ok(output.content.includes(`description: ${config.description}`));
  });

  it('includes mode: subagent', () => {
    const output = adapter.generate(agent, config);
    assert.ok(output.content.includes('mode: subagent'));
  });

  it('includes permission block', () => {
    const output = adapter.generate(agent, config);
    assert.ok(output.content.includes('permission:'));
    assert.ok(output.content.includes('edit: allow'));
  });

  it('includes agent instructions', () => {
    const output = adapter.generate(agent, config);
    assert.ok(output.content.includes('# Angular Architect'));
  });

  it('generates correct install path', () => {
    const path = adapter.getInstallPath('test');
    assert.equal(path, '.opencode/agents/test.md');
  });

  it('generates correct custom install path', () => {
    const path = adapter.getInstallPath('test', './my-agents');
    assert.equal(path, './my-agents/test.md');
  });
});

describe('Claude Adapter', () => {
  const adapter = createClaudeAdapter();
  const agent = loadTestAgent('angular-migrator');
  const config = loadTestAgentConfig('angular-migrator', 'claude');

  it('generates correct filename', () => {
    const output = adapter.generate(agent, config);
    assert.equal(output.filename, 'angular-migrator.md');
  });

  it('includes frontmatter with name and description', () => {
    const output = adapter.generate(agent, config);
    assert.ok(output.content.startsWith('---'));
    assert.ok(output.content.includes('name: angular-migrator'));
    assert.ok(output.content.includes(`description: ${config.description}`));
  });

  it('includes tools', () => {
    const output = adapter.generate(agent, config);
    assert.ok(output.content.includes('tools:'));
  });

  it('does NOT include OpenCode-specific fields', () => {
    const output = adapter.generate(agent, config);
    assert.ok(!output.content.includes('mode: subagent'));
    assert.ok(!output.content.includes('permission:'));
  });

  it('includes agent instructions', () => {
    const output = adapter.generate(agent, config);
    assert.ok(output.content.includes('# Angular Migrator'));
  });

  it('generates correct install path', () => {
    const path = adapter.getInstallPath('test');
    assert.equal(path, '.claude/agents/test.md');
  });
});

describe('Codex Adapter', () => {
  const adapter = createCodexAdapter();
  const agent = loadTestAgent('angular-reviewer');
  const config = loadTestAgentConfig('angular-reviewer', 'codex');

  it('generates correct filename', () => {
    const output = adapter.generate(agent, config);
    assert.equal(output.filename, 'angular-reviewer.toml');
  });

  it('is valid TOML format', () => {
    const output = adapter.generate(agent, config);
    assert.ok(output.content.includes('name = "angular-reviewer"'));
    assert.ok(output.content.includes('description ='));
    assert.ok(output.content.includes('developer_instructions ='));
  });

  it('does NOT include YAML frontmatter', () => {
    const output = adapter.generate(agent, config);
    assert.ok(!output.content.startsWith('---'));
  });

  it('generates correct install path', () => {
    const path = adapter.getInstallPath('test');
    assert.equal(path, '.codex/agents/test.toml');
  });
});

describe('CLI Integration', () => {
  it('loads agent from agents directory', () => {
    const agent = loadTestAgent('angular-architect');
    assert.equal(agent.metadata.name, 'angular-architect');
    assert.ok(agent.instructions.content.length > 0);
  });

  it('loads agent config for specific AI', () => {
    const config = loadTestAgentConfig('angular-architect', 'opencode');
    assert.ok(config.description);
    assert.equal(config.mode, 'subagent');
  });

  it('generates output with adapter', () => {
    const adapter = createOpenCodeAdapter();
    const agent = loadTestAgent('angular-architect');
    const config = loadTestAgentConfig('angular-architect', 'opencode');
    const output = adapter.generate(agent, config);

    assert.ok(output.filename.endsWith('.md'));
    assert.ok(output.content.length > 0);
  });
});

describe('Install Path Calculation', () => {
  it('opencode uses default dir', () => {
    const adapter = createOpenCodeAdapter();
    assert.equal(adapter.getInstallPath('my-agent'), '.opencode/agents/my-agent.md');
  });

  it('claude uses default dir', () => {
    const adapter = createClaudeAdapter();
    assert.equal(adapter.getInstallPath('my-agent'), '.claude/agents/my-agent.md');
  });

  it('codex uses default dir', () => {
    const adapter = createCodexAdapter();
    assert.equal(adapter.getInstallPath('my-agent'), '.codex/agents/my-agent.toml');
  });

  it('custom target overrides default', () => {
    const adapter = createOpenCodeAdapter();
    assert.equal(adapter.getInstallPath('my-agent', './custom'), './custom/my-agent.md');
  });
});

describe('Error Handling', () => {
  it('throws for unknown AI', () => {
    assert.equal(getAdapter('unknown-ai'), undefined);
  });

  it('throws when agent not found', () => {
    assert.throws(() => {
      loadTestAgent('nonexistent-agent');
    }, /not found/);
  });
});
