import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Adapter, AdapterOutput, InstallOptions, UniversalAgent } from '../../src/types.js';

const DEFAULT_CONFIG: Record<string, unknown> = {
  description: 'Angular agent for OpenCode',
  mode: 'subagent',
  permission: {
    edit: 'allow',
    bash: 'ask',
  },
};

function loadConfigFromAgent(agentBasePath: string, ai: string): Record<string, unknown> {
  const configPath = join(agentBasePath, 'configs', `${ai}.yaml`);

  try {
    return parseYaml(readFileSync(configPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function createOpenCodeAdapter(): Adapter {
  return {
    name: 'opencode',
    description: 'OpenCode AI coding agent',
    defaultDir: '.opencode/agents',
    extension: 'md',

    generate(agent: UniversalAgent, config?: Record<string, unknown>): AdapterOutput {
      const agentConfig = loadConfigFromAgent(agent.basePath, 'opencode');
      const cfg = { ...DEFAULT_CONFIG, ...agentConfig, ...config };

      const frontmatter = [
        '---',
        `description: ${cfg.description || agent.metadata.description}`,
        `mode: ${cfg.mode || 'subagent'}`,
      ];

      if (cfg.permission) {
        frontmatter.push('permission:');
        const perm = cfg.permission as Record<string, string>;
        for (const [key, value] of Object.entries(perm)) {
          frontmatter.push(`  ${key}: ${value}`);
        }
      }

      frontmatter.push('---', '');

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
