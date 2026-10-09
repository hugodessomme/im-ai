import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copyFixtureLibrary, createSandbox } from "../../test/sandbox.ts";
import { ExistsError, ImAiError } from "./errors.ts";
import { listResources } from "./library.ts";
import { init } from "./init.ts";
import { machineConfigPath, readMachineConfig, writeMachineConfig } from "./machine-store.ts";

describe("init", () => {
  it("creates the library and writes the machine config", async () => {
    const sandbox = await createSandbox();

    const result = await init({ library: sandbox.library, agents: ["claude", "codex"] }, sandbox.env);

    expect(result).toEqual({
      library: sandbox.library,
      machineConfig: join(sandbox.home, ".config/im-ai/config.json"),
    });
    expect(await listResources(sandbox.library)).toEqual([]);
    expect(await readMachineConfig(sandbox.env)).toEqual({ library: sandbox.library, agents: ["claude", "codex"] });
  });

  it("refuses to overwrite an existing machine config, and creates nothing", async () => {
    const sandbox = await createSandbox();
    const existing = { library: "/elsewhere/library", agents: ["codex" as const] };
    await writeMachineConfig(sandbox.env, existing);

    const result = init({ library: sandbox.library, agents: ["claude"] }, sandbox.env);

    await expect(result).rejects.toThrow(ExistsError);
    await expect(result).rejects.toThrow(`A machine config already exists at ${machineConfigPath(sandbox.env)}.`);
    expect(await readMachineConfig(sandbox.env)).toEqual(existing);
    await expect(access(sandbox.library)).rejects.toThrow();
  });

  it("refuses to overwrite an existing library, and writes no machine config", async () => {
    const sandbox = await createSandbox();
    await copyFixtureLibrary(sandbox);

    const result = init({ library: sandbox.library, agents: ["claude"] }, sandbox.env);

    await expect(result).rejects.toThrow(ExistsError);
    await expect(readMachineConfig(sandbox.env)).rejects.toThrow("No machine config");
  });

  it("with overwrite, replaces the machine config and initializes the existing folder", async () => {
    const sandbox = await createSandbox();
    await writeMachineConfig(sandbox.env, { library: "/elsewhere/library", agents: ["codex"] });
    await copyFixtureLibrary(sandbox);

    await init({ library: sandbox.library, agents: ["claude"], overwrite: true }, sandbox.env);

    expect(await readMachineConfig(sandbox.env)).toEqual({ library: sandbox.library, agents: ["claude"] });
    expect(await readFile(join(sandbox.library, "im-ai.json"), "utf8")).toBe("{}\n");
    expect(await listResources(sandbox.library)).toHaveLength(3);
  });

  it.each([
    [[], "Choose at least one agent. Known agents: claude, codex."],
    [["claude", "cursor"], 'Unknown agent "cursor". Known agents: claude, codex.'],
  ])("refuses the agents %j, and creates nothing", async (agents, message) => {
    const sandbox = await createSandbox();

    await expect(init({ library: sandbox.library, agents }, sandbox.env)).rejects.toThrow(new ImAiError(message));
    await expect(access(sandbox.library)).rejects.toThrow();
  });
});
