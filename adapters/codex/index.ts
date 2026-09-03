import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Adapter, AdapterOutput, InstallOptions, UniversalAgent } from '../../src/types.js';

const DEFAULT_CONFIG: Record<string, unknown> = {
  description: 'Angular agent for Codex',
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

export function createCodexAdapter(): Adapter {
  return {
    name: 'codex',
    description: 'OpenAI Codex CLI',
    defaultDir: '.codex/agents',
    extension: 'toml',

    generate(agent: UniversalAgent, config?: Record<string, unknown>): AdapterOutput {
      const agentConfig = loadConfigFromAgent(agent.basePath, 'codex');
      const cfg = { ...DEFAULT_CONFIG, ...agentConfig, ...config };

      const escapedInstructions = agent.instructions.content
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');

      const content = [
        `name = "${cfg.name || agent.metadata.name}"`,
        `description = "${cfg.description || agent.metadata.description}"`,
        `developer_instructions = "${escapedInstructions}"`,
        '',
      ].join('\n');

      return {
        filename: `${agent.metadata.name}.toml`,
        content,
      };
    },

    getInstallPath(name: string, targetDir?: string): string {
      const base = targetDir || this.defaultDir;
      return `${base}/${name}.${this.extension}`;
    },
  };
}
