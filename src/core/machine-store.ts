import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";
import { type AgentId, agentIds, isAgentId } from "./agents.ts";
import type { Env } from "./env.ts";
import { ExistsError, ImAiError } from "./errors.ts";
import { readFileIfExists } from "./fs.ts";

export type MachineConfig = {
  /** Absolute path of the library. */
  library: string;
  /** The active agents. */
  agents: AgentId[];
};

/** Where the machine config lives: `$XDG_CONFIG_HOME/im-ai/config.json`, by default `~/.config/im-ai/config.json`. */
export function machineConfigPath(env: Env): string {
  const configHome = env.XDG_CONFIG_HOME || join(env.HOME ?? "", ".config");
  return join(configHome, "im-ai", "config.json");
}

export async function readMachineConfig(env: Env): Promise<MachineConfig> {
  const path = machineConfigPath(env);
  const text = await readFileIfExists(path);
  if (text === undefined) {
    throw new ImAiError(`No machine config at ${path}. Run \`im-ai init\` to create your library.`);
  }

  const fix = "Fix it, or delete it and run `im-ai init`.";
  let config: unknown;
  try {
    config = JSON.parse(text);
  } catch {
    throw new ImAiError(`The machine config at ${path} is not valid JSON. ${fix}`);
  }
  if (!isMachineConfig(config)) {
    throw new ImAiError(
      `The machine config at ${path} must hold "library" (an absolute path) and "agents" (a list of: ${agentIds.join(", ")}). ${fix}`,
    );
  }
  return config;
}

/** Throws an `ExistsError` when a machine config exists. */
export async function assertNoMachineConfig(env: Env): Promise<void> {
  const path = machineConfigPath(env);
  const exists = await access(path).then(
    () => true,
    () => false,
  );
  if (exists) throw existsError(path);
}

/** Writes the machine config and returns its path. It refuses to replace an existing one, unless `overwrite` is set. */
export async function writeMachineConfig(
  env: Env,
  config: MachineConfig,
  options: { overwrite?: boolean } = {},
): Promise<string> {
  const path = machineConfigPath(env);
  await mkdir(dirname(path), { recursive: true });
  try {
    await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, { flag: options.overwrite ? "w" : "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw existsError(path);
    throw error;
  }
  return path;
}

function existsError(path: string): ExistsError {
  return new ExistsError(`A machine config already exists at ${path}.`);
}

function isMachineConfig(value: unknown): value is MachineConfig {
  const { library, agents } = (value ?? {}) as Record<string, unknown>;
  return (
    typeof library === "string" && isAbsolute(library) && Array.isArray(agents) && agents.every(isAgentId)
  );
}
