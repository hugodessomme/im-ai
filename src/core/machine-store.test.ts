import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { createSandbox } from "../../test/sandbox.ts";
import { ImAiError } from "./errors.ts";
import { machineConfigPath, readMachineConfig, writeMachineConfig } from "./machine-store.ts";

describe("machine store", () => {
  it("fails with a clear message when no machine config exists", async () => {
    const sandbox = await createSandbox();
    const path = join(sandbox.home, ".config/im-ai/config.json");

    await expect(readMachineConfig(sandbox.env)).rejects.toThrow(
      new ImAiError(`No machine config at ${path}. Run \`im-ai init\` to create your library.`),
    );
  });

  it("uses ~/.config when XDG_CONFIG_HOME is not set", async () => {
    const sandbox = await createSandbox();
    const { XDG_CONFIG_HOME: _, ...env } = sandbox.env;
    const config = { library: sandbox.library, agents: ["codex" as const] };

    await writeMachineConfig(env, config);

    expect(machineConfigPath(env)).toBe(join(sandbox.home, ".config/im-ai/config.json"));
    expect(await readMachineConfig(env)).toEqual(config);
  });

  it("fails with a clear message when the machine config is not valid JSON", async () => {
    const sandbox = await createSandbox();
    const path = machineConfigPath(sandbox.env);
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, "{ library: ");

    await expect(readMachineConfig(sandbox.env)).rejects.toThrow(
      new ImAiError(`The machine config at ${path} is not valid JSON. Fix it, or delete it and run \`im-ai init\`.`),
    );
  });

  it.each([
    ["an empty object", "{}"],
    ["agents that are not a list", '{ "library": "/library", "agents": "claude" }'],
    ["an unknown agent", '{ "library": "/library", "agents": ["cursor"] }'],
  ])("fails with a clear message when the machine config holds %s", async (_, content) => {
    const sandbox = await createSandbox();
    const path = machineConfigPath(sandbox.env);
    await mkdir(join(path, ".."), { recursive: true });
    await writeFile(path, content);

    await expect(readMachineConfig(sandbox.env)).rejects.toThrow(
      new ImAiError(
        `The machine config at ${path} must hold "library" (an absolute path) and "agents" (a list of: claude, codex). Fix it, or delete it and run \`im-ai init\`.`,
      ),
    );
  });
});
