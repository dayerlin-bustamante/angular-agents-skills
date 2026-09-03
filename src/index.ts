export type { AgentMetadata, AgentInstructions, UniversalAgent, AdapterOutput, InstallOptions, Adapter } from './types.js';
export { registerAdapter, getAdapter, listAdapters, hasAdapter } from './registry.js';
export { createOpenCodeAdapter } from '../adapters/opencode/index.js';
export { createClaudeAdapter } from '../adapters/claude/index.js';
export { createCodexAdapter } from '../adapters/codex/index.js';
export { createCursorAdapter } from '../adapters/cursor/index.js';
export { createCopilotAdapter } from '../adapters/copilot/index.js';
