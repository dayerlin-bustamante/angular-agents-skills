import type { Adapter } from './types.js';

const adapters = new Map<string, Adapter>();

export function registerAdapter(adapter: Adapter): void {
  adapters.set(adapter.name, adapter);
}

export function getAdapter(name: string): Adapter | undefined {
  return adapters.get(name);
}

export function listAdapters(): string[] {
  return Array.from(adapters.keys());
}

export function hasAdapter(name: string): boolean {
  return adapters.has(name);
}
