import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Adapter, AdapterOutput, InstallOptions, UniversalAgent } from '../../src/types.js';

const DEFAULT_CONFIG: Record<string, unknown> = {
  description: 'Angular agent for Cursor',
  name: 'angular-agent',
};

function loadConfigFromAgent(agentBasePath: string, ai: string): Record<string, unknown> {
  const configPath = join(agentBasePath, 'configs', `${ai}.yaml`);

  try {
    return parseYaml(readFileSync(configPath, 'utf-8'));
  } catch {
    return {};
  }
}

export function createCursorAdapter(): Adapter {
  return {
    name: 'cursor',
    description: 'Cursor AI IDE',
    defaultDir: '.cursor/rules',
    extension: 'mdc',

    generate(agent: UniversalAgent, config?: Record<string, unknown>): AdapterOutput {
      const agentConfig = loadConfigFromAgent(agent.basePath, 'cursor');
      const cfg = { ...DEFAULT_CONFIG, ...agentConfig, ...config };

      const frontmatter = [
        '---',
        `description: ${cfg.description || agent.metadata.description}`,
        'alwaysApply: false',
        '---',
        '',
      ];

      return {
        filename: `${agent.metadata.name}.mdc`,
        content: frontmatter.join('\n') + agent.instructions.content,
      };
    },

    getInstallPath(name: string, targetDir?: string): string {
      const base = targetDir || this.defaultDir;
      return `${base}/${name}.${this.extension}`;
    },
  };
}
