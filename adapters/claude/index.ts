import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Adapter, AdapterOutput, InstallOptions, UniversalAgent } from '../../src/types.js';

const DEFAULT_CONFIG: Record<string, unknown> = {
  description: 'Angular agent for Claude',
  name: 'angular-agent',
  tools: 'Read, Grep, Glob, Edit, Write, Bash',
};

function loadConfigFromAgent(agentBasePath: string, ai: string): Record<string, unknown> {
  const configPath = join(agentBasePath, 'configs', `${ai}.yaml`);

  try {
    return parseYaml(readFileSync(configPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function createClaudeAdapter(): Adapter {
  return {
    name: 'claude',
    description: 'Claude Code',
    defaultDir: '.claude/agents',
    extension: 'md',

    generate(agent: UniversalAgent, config?: Record<string, unknown>): AdapterOutput {
      const agentConfig = loadConfigFromAgent(agent.basePath, 'claude');
      const cfg = { ...DEFAULT_CONFIG, ...agentConfig, ...config };

      const frontmatter = [
        '---',
        `name: ${cfg.name || agent.metadata.name}`,
        `description: ${cfg.description || agent.metadata.description}`,
        `tools: ${cfg.tools || 'Read, Grep, Glob, Edit, Write, Bash'}`,
        '---',
        '',
      ];

      return {
        filename: `${agent.metadata.name}.md`,
        content: frontmatter.join('\n') + agent.instructions.content,
      };
    },

    getInstallPath(name: string, targetDir?: string): string {
      const base = targetDir || this.defaultDir;
      return `${base}/${name}.${this.extension}`;
    },
  };
}
