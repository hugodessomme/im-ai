import { type AgentId, agentIds, isAgentId } from "./agents.ts";
import type { Env } from "./env.ts";
import { ImAiError } from "./errors.ts";
import { createLibrary } from "./library.ts";
import { assertNoMachineConfig, writeMachineConfig } from "./machine-store.ts";

export type InitOptions = {
  /** Absolute path of the new library. */
  library: string;
  /** The active agents, for example `["claude", "codex"]`. */
  agents: readonly string[];
  /** Replace an existing machine config, and initialize the library folder even if it is not empty (its files are kept). */
  overwrite?: boolean;
};

/**
 * Creates the library and the machine config that points to it.
 * Without `overwrite`, it changes nothing when the machine config exists or the library folder is not empty.
 */
export async function init(options: InitOptions, env: Env): Promise<{ library: string; machineConfig: string }> {
  const { library, overwrite = false } = options;
  const agents = parseAgents(options.agents);

  if (!overwrite) {
    await assertNoMachineConfig(env);
  }
  await createLibrary(library, { env, overwrite });
  const machineConfig = await writeMachineConfig(env, { library, agents }, { overwrite });
  return { library, machineConfig };
}

function parseAgents(names: readonly string[]): AgentId[] {
  const known = `Known agents: ${agentIds.join(", ")}.`;
  if (names.length === 0) {
    throw new ImAiError(`Choose at least one agent. ${known}`);
  }
  for (const name of names) {
    if (!isAgentId(name)) {
      throw new ImAiError(`Unknown agent "${name}". ${known}`);
    }
  }
  return [...new Set(names as AgentId[])];
}
