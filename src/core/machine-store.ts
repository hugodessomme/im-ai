import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AgentId } from "./agents.ts";
import type { Env } from "./env.ts";
import { ExistsError, ImAiError } from "./errors.ts";

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
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      throw new ImAiError(`No machine config at ${path}. Run \`im-ai init\` to create your library.`);
    }
    throw error;
  }

  try {
    return JSON.parse(text) as MachineConfig;
  } catch {
    throw new ImAiError(`The machine config at ${path} is not valid JSON. Fix it, or delete it and run \`im-ai init\`.`);
  }
}

export async function hasMachineConfig(env: Env): Promise<boolean> {
  return access(machineConfigPath(env)).then(
    () => true,
    () => false,
  );
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
    if ((error as NodeJS.ErrnoException).code === "EEXIST") {
      throw new ExistsError(`A machine config already exists at ${path}.`);
    }
    throw error;
  }
  return path;
}
