import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Adapter, AdapterOutput, InstallOptions, UniversalAgent } from '../../src/types.js';

const DEFAULT_CONFIG: Record<string, unknown> = {
  description: 'Angular agent for GitHub Copilot',
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

export function createCopilotAdapter(): Adapter {
  return {
    name: 'copilot',
    description: 'GitHub Copilot',
    defaultDir: '.github',
    extension: 'md',

    generate(agent: UniversalAgent, config?: Record<string, unknown>): AdapterOutput {
      const agentConfig = loadConfigFromAgent(agent.basePath, 'copilot');
      const cfg = { ...DEFAULT_CONFIG, ...agentConfig, ...config };

      const header = `# ${cfg.name || agent.metadata.name}\n\n${cfg.description || agent.metadata.description}\n\n`;

      return {
        filename: `copilot-instructions-${agent.metadata.name}.md`,
        content: header + agent.instructions.content,
      };
    },

    getInstallPath(name: string, targetDir?: string): string {
      const base = targetDir || this.defaultDir;
      return `${base}/${name}-instructions.${this.extension}`;
    },
  };
}
