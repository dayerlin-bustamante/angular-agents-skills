export interface AgentMetadata {
  name: string;
  description: string;
}

export interface AgentInstructions {
  content: string;
}

export interface UniversalAgent {
  metadata: AgentMetadata;
  instructions: AgentInstructions;
  basePath: string;
}

export interface AdapterOutput {
  filename: string;
  content: string;
  directory?: string;
}

export interface InstallOptions {
  name: string;
  ai: string;
  targetDir?: string;
}

export interface Adapter {
  readonly name: string;
  readonly description: string;
  readonly defaultDir: string;
  readonly extension: string;
  generate(agent: UniversalAgent, config?: Record<string, unknown>): AdapterOutput;
  getInstallPath(name: string, targetDir?: string): string;
}
