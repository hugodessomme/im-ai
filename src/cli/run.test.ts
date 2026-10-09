import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copyFixtureLibrary, createSandbox, runCli } from "../../test/sandbox.ts";
import { writeMachineConfig } from "../core/machine-store.ts";

describe("im-ai init", () => {
  it("creates the library and the machine config, then list shows an empty library", async () => {
    const sandbox = await createSandbox();

    const initResult = await runCli(sandbox, ["init", "--library", "../library", "--agents", "claude,codex"]);
    const listResult = await runCli(sandbox, ["list"]);

    expect(initResult).toEqual({
      code: 0,
      stdout:
        `Created the library at ${sandbox.library}\n` +
        `Wrote the machine config at ${join(sandbox.home, ".config/im-ai/config.json")}\n`,
      stderr: "",
    });
    expect(listResult).toEqual({ code: 0, stdout: "No skills in the library.\n", stderr: "" });
  });
});

describe("im-ai init, refusals", () => {
  it("refuses to overwrite an existing machine config without --force", async () => {
    const sandbox = await createSandbox();
    await writeMachineConfig(sandbox.env, { library: "/elsewhere/library", agents: ["codex"] });

    const result = await runCli(sandbox, ["init", "--library", sandbox.library, "--agents", "claude"]);

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: `im-ai: A machine config already exists at ${join(sandbox.home, ".config/im-ai/config.json")}. Use --force to overwrite it.\n`,
    });
  });

  it("refuses to overwrite an existing library without --force", async () => {
    const sandbox = await createSandbox();
    await copyFixtureLibrary(sandbox);

    const result = await runCli(sandbox, ["init", "--library", sandbox.library, "--agents", "claude"]);

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: `im-ai: The folder ${sandbox.library} is not empty. Use --force to overwrite it.\n`,
    });
  });

  it("overwrites an existing library and machine config with --force", async () => {
    const sandbox = await createSandbox();
    await writeMachineConfig(sandbox.env, { library: "/elsewhere/library", agents: ["codex"] });
    await copyFixtureLibrary(sandbox);

    const initResult = await runCli(sandbox, ["init", "--library", sandbox.library, "--agents", "claude", "--force"]);
    const listResult = await runCli(sandbox, ["list"]);

    expect(initResult.code).toBe(0);
    expect(listResult.stdout).toContain("commit-messages");
  });

  it.each([
    [["init", "--agents", "claude"], "init needs --library <path>."],
    [["init", "--library", "lib"], "init needs --agents <list>, for example --agents claude,codex."],
    [["init", "--library", "lib", "--agents", "claude", "--colour"], "Unknown option '--colour'"],
  ])("rejects %j with a usage message", async (args, message) => {
    const sandbox = await createSandbox();

    const result = await runCli(sandbox, args);

    expect(result.code).toBe(1);
    expect(result.stderr).toContain(`im-ai: ${message}`);
    expect(result.stderr).toContain("Usage:");
  });
});

describe("im-ai without a machine config", () => {
  it.each([["list"]])("%s fails with a clear message", async (command) => {
    const sandbox = await createSandbox();

    const result = await runCli(sandbox, [command]);

    expect(result).toEqual({
      code: 1,
      stdout: "",
      stderr: `im-ai: No machine config at ${join(sandbox.home, ".config/im-ai/config.json")}. Run \`im-ai init\` to create your library.\n`,
    });
  });
});

describe("im-ai usage", () => {
  it.each([[["--help"]], [["help"]], [[]]])("%j prints the usage", async (args) => {
    const sandbox = await createSandbox();

    const result = await runCli(sandbox, args);

    expect(result.code).toBe(0);
    expect(result.stdout).toMatch(/^Usage:/);
    expect(result.stdout).toContain("im-ai init --library <path> --agents <list> [--force]");
    expect(result.stdout).toContain("im-ai list");
  });

  it("rejects an unknown command", async () => {
    const sandbox = await createSandbox();

    const result = await runCli(sandbox, ["nope"]);

    expect(result.code).toBe(1);
    expect(result.stderr).toMatch(/^im-ai: Unknown command "nope"\.\n\nUsage:/);
  });
});

describe("im-ai list", () => {
  it("shows every skill with its description, and flags invalid skills with the reasons", async () => {
    const sandbox = await createSandbox();
    const library = await copyFixtureLibrary(sandbox);
    await writeMachineConfig(sandbox.env, { library, agents: ["claude"] });
    await mkdir(join(library, "skills/broken"));
    await writeFile(join(library, "skills/broken/SKILL.md"), "---\nname: broken-skill\n---\n");

    const result = await runCli(sandbox, ["list"]);

    expect(result).toEqual({
      code: 0,
      stdout: [
        'broken                 INVALID: name "broken-skill" does not match the folder name "broken"; description is missing',
        "code-review-checklist  Review a diff against a fixed checklist (correctness, tests, naming, error handling). Use when the user asks for a review of a branch, a pull request or staged changes.",
        "commit-messages        Write git commit messages in the Conventional Commits format. Use when the user asks to commit, or to write or fix a commit message.",
        "writing-adrs           Record an architecture decision as a short ADR in docs/adr/. Use when a decision is hard to reverse, surprising without context, or the result of a real trade-off.",
        "",
      ].join("\n"),
      stderr: "",
    });
  });
});
