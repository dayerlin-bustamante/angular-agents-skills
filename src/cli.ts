import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { UniversalAgent, Adapter, InstallOptions } from './types.js';
import { registerAdapter, getAdapter, listAdapters, hasAdapter } from './registry.js';
import { createOpenCodeAdapter } from '../adapters/opencode/index.js';
import { createClaudeAdapter } from '../adapters/claude/index.js';
import { createCodexAdapter } from '../adapters/codex/index.js';
import { createCursorAdapter } from '../adapters/cursor/index.js';
import { createCopilotAdapter } from '../adapters/copilot/index.js';

registerAdapter(createOpenCodeAdapter());
registerAdapter(createClaudeAdapter());
registerAdapter(createCodexAdapter());
registerAdapter(createCursorAdapter());
registerAdapter(createCopilotAdapter());

function loadAgent(agentName: string, agentsDir: string): UniversalAgent {
  const agentPath = join(agentsDir, agentName);

  if (!existsSync(agentPath)) {
    throw new Error(`Agent "${agentName}" not found at ${agentPath}`);
  }

  const mdPath = join(agentPath, 'agent.md');

  if (!existsSync(mdPath)) {
    throw new Error(`Agent "${agentName}" missing agent.md at ${mdPath}`);
  }

  const mdContent = readFileSync(mdPath, 'utf-8');
  const name = agentName;
  const description = mdContent.split('\n')[0]?.replace(/^#\s+/, '') || agentName;

  return {
    metadata: { name, description },
    instructions: { content: mdContent },
    basePath: agentPath,
  };
}

function loadAgentConfig(agentName: string, ai: string, agentsDir: string): Record<string, unknown> | undefined {
  const configPath = join(agentsDir, agentName, 'configs', `${ai}.yaml`);

  if (!existsSync(configPath)) {
    return undefined;
  }

  const configContent = readFileSync(configPath, 'utf-8');
  return parseYaml(configContent);
}

function loadSkill(skillName: string, skillsDir: string): { content: string; metadata: Record<string, unknown> } {
  const skillPath = findSkillPath(skillName, skillsDir);

  if (!skillPath) {
    throw new Error(`Skill "${skillName}" not found at ${skillsDir}`);
  }

  const mdContent = readFileSync(join(skillPath, 'SKILL.md'), 'utf-8');
  const parsed = parseYaml(mdContent.split('---')[1] || '');

  return {
    content: mdContent,
    metadata: parsed || {},
  };
}

function findSkillPath(skillName: string, skillsDir: string): string | null {
  if (!existsSync(skillsDir)) {
    return null;
  }

  const categories = readdirSync(skillsDir).filter((entry) => {
    return statSync(join(skillsDir, entry)).isDirectory();
  });

  for (const category of categories) {
    const categoryPath = join(skillsDir, category);
    const skills = readdirSync(categoryPath).filter((entry) => {
      return statSync(join(categoryPath, entry)).isDirectory();
    });

    for (const skill of skills) {
      if (skill === skillName) {
        return join(categoryPath, skill);
      }
    }
  }

  return null;
}

function listAgents(agentsDir: string): string[] {
  if (!existsSync(agentsDir)) {
    return [];
  }

  return readdirSync(agentsDir).filter((entry) => {
    const entryPath = join(agentsDir, entry);
    return statSync(entryPath).isDirectory() && existsSync(join(entryPath, 'agent.md'));
  });
}

function listSkills(skillsDir: string): string[] {
  if (!existsSync(skillsDir)) {
    return [];
  }

  const skills: string[] = [];
  const categories = readdirSync(skillsDir).filter((entry) => {
    return statSync(join(skillsDir, entry)).isDirectory();
  });

  for (const category of categories) {
    const categoryPath = join(skillsDir, category);
    const categorySkills = readdirSync(categoryPath).filter((entry) => {
      const skillPath = join(categoryPath, entry);
      return statSync(skillPath).isDirectory() && existsSync(join(skillPath, 'SKILL.md'));
    });

    for (const skill of categorySkills) {
      skills.push(skill);
    }
  }

  return skills;
}

function installAgent(agentName: string, ai: string, agentsDir: string, targetDir?: string): void {
  const adapter = getAdapter(ai);
  if (!adapter) {
    const available = listAdapters().join(', ');
    throw new Error(`Unknown AI "${ai}". Available: ${available}`);
  }

  const agent = loadAgent(agentName, agentsDir);
  const config = loadAgentConfig(agentName, ai, agentsDir);
  const output = adapter.generate(agent, config);
  const installPath = adapter.getInstallPath(agentName, targetDir);

  const dir = dirname(installPath);
  mkdirSync(dir, { recursive: true });

  writeFileSync(installPath, output.content, 'utf-8');
  console.log(`Installed agent "${agentName}" for ${adapter.name} → ${installPath}`);
}

function installAgentAll(agentName: string, agentsDir: string, targetDir?: string): void {
  for (const aiName of listAdapters()) {
    const adapter = getAdapter(aiName)!;
    const base = targetDir || adapter.defaultDir;
    const aiTarget = join(base, aiName);
    installAgent(agentName, aiName, agentsDir, aiTarget);
  }
}

function installSkill(skillName: string, ai: string, skillsDir: string, targetDir?: string): void {
  const adapter = getAdapter(ai);
  if (!adapter) {
    const available = listAdapters().join(', ');
    throw new Error(`Unknown AI "${ai}". Available: ${available}`);
  }

  const skill = loadSkill(skillName, skillsDir);
  const filename = `${skillName}.md`;
  const base = targetDir || join(adapter.defaultDir, 'skills');
  const installPath = join(base, filename);

  const dir = dirname(installPath);
  mkdirSync(dir, { recursive: true });

  writeFileSync(installPath, skill.content, 'utf-8');
  console.log(`Installed skill "${skillName}" for ${adapter.name} → ${installPath}`);
}

function installSkillAll(skillName: string, skillsDir: string, targetDir?: string): void {
  for (const aiName of listAdapters()) {
    const adapter = getAdapter(aiName)!;
    const base = targetDir || join(adapter.defaultDir, 'skills');
    const aiTarget = join(base, aiName);
    installSkill(skillName, aiName, skillsDir, aiTarget);
  }
}

function printHelp(): void {
  console.log(`
angular-ai — Install Angular agents and skills for AI coding tools

Usage:
  npx angular-ai agent <name> --ai <tool> [--target <path>]
  npx angular-ai agent <name> --all [--target <path>]
  npx angular-ai skill <name> --ai <tool> [--target <path>]
  npx angular-ai skill <name> --all [--target <path>]
  npx angular-ai list agents
  npx angular-ai list skills
  npx angular-ai list adapters

Options:
  --ai <tool>        Target AI tool: ${listAdapters().join(', ')}
  --all              Install for all available AI tools
  --target <path>    Custom target directory

Examples:
  npx angular-ai agent angular-architect --ai opencode
  npx angular-ai skill standalone-component-library --ai claude
  npx angular-ai agent angular-architect --ai opencode --target ./my-agents
  npx angular-ai skill signals-state-management --all
`);
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    return;
  }

  const command = args[0];

  if (command === 'list') {
    const type = args[1];
    if (type === 'agents') {
      const agents = listAgents(resolve('agents'));
      if (agents.length === 0) {
        console.log('No agents found.');
      } else {
        console.log('Available agents:');
        for (const agent of agents) {
          console.log(`  - ${agent}`);
        }
      }
      return;
    }
    if (type === 'skills') {
      const skills = listSkills(resolve('skills'));
      if (skills.length === 0) {
        console.log('No skills found.');
      } else {
        console.log('Available skills:');
        for (const skill of skills) {
          console.log(`  - ${skill}`);
        }
      }
      return;
    }
    if (type === 'adapters') {
      console.log('Available adapters:');
      for (const name of listAdapters()) {
        const adapter = getAdapter(name)!;
        console.log(`  - ${name}: ${adapter.description}`);
      }
      return;
    }
    console.error(`Unknown list type: ${type}. Use "agents", "skills", or "adapters".`);
    process.exit(1);
  }

  if (command === 'agent') {
    const agentName = args[1];
    if (!agentName) {
      console.error('Error: agent name is required.');
      process.exit(1);
    }

    const aiIndex = args.indexOf('--ai');
    const allFlag = args.includes('--all');
    const targetIndex = args.indexOf('--target');

    const targetDir = targetIndex !== -1 ? args[targetIndex + 1] : undefined;
    const agentsDir = resolve('agents');

    if (!allFlag && aiIndex === -1) {
      console.error('Error: specify --ai <tool> or --all');
      process.exit(1);
    }

    try {
      if (allFlag) {
        installAgentAll(agentName, agentsDir, targetDir);
      } else {
        const ai = args[aiIndex + 1];
        if (!ai) {
          console.error('Error: --ai requires a value');
          process.exit(1);
        }
        installAgent(agentName, ai, agentsDir, targetDir);
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }

    return;
  }

  if (command === 'skill') {
    const skillName = args[1];
    if (!skillName) {
      console.error('Error: skill name is required.');
      process.exit(1);
    }

    const aiIndex = args.indexOf('--ai');
    const allFlag = args.includes('--all');
    const targetIndex = args.indexOf('--target');

    const targetDir = targetIndex !== -1 ? args[targetIndex + 1] : undefined;
    const skillsDir = resolve('skills');

    if (!allFlag && aiIndex === -1) {
      console.error('Error: specify --ai <tool> or --all');
      process.exit(1);
    }

    try {
      if (allFlag) {
        installSkillAll(skillName, skillsDir, targetDir);
      } else {
        const ai = args[aiIndex + 1];
        if (!ai) {
          console.error('Error: --ai requires a value');
          process.exit(1);
        }
        installSkill(skillName, ai, skillsDir, targetDir);
      }
    } catch (err) {
      console.error(`Error: ${(err as Error).message}`);
      process.exit(1);
    }

    return;
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
}

main();

export { loadAgent, loadAgentConfig, loadSkill, listAgents, listSkills, installAgent, installAgentAll, installSkill, installSkillAll };
export type { UniversalAgent, Adapter, InstallOptions };
export { registerAdapter, getAdapter, listAdapters, hasAdapter };
