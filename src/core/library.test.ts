import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copyFixtureLibrary, createSandbox, gitOutput } from "../../test/sandbox.ts";
import { ExistsError, ImAiError } from "./errors.ts";
import { createLibrary, listResources } from "./library.ts";

describe("listResources", () => {
  it("lists every skill of the library, sorted by name, with its description", async () => {
    const library = await copyFixtureLibrary(await createSandbox());

    const resources = await listResources(library);

    expect(resources).toEqual([
      {
        kind: "skill",
        name: "code-review-checklist",
        description:
          "Review a diff against a fixed checklist (correctness, tests, naming, error handling). Use when the user asks for a review of a branch, a pull request or staged changes.",
        problems: [],
      },
      {
        kind: "skill",
        name: "commit-messages",
        description:
          "Write git commit messages in the Conventional Commits format. Use when the user asks to commit, or to write or fix a commit message.",
        problems: [],
      },
      {
        kind: "skill",
        name: "writing-adrs",
        description:
          "Record an architecture decision as a short ADR in docs/adr/. Use when a decision is hard to reverse, surprising without context, or the result of a real trade-off.",
        problems: [],
      },
    ]);
  });

  it("lists an invalid skill with the reasons", async () => {
    const library = await copyFixtureLibrary(await createSandbox());
    await mkdir(join(library, "skills/broken"));
    await writeFile(join(library, "skills/broken/SKILL.md"), "---\nname: Broken\n---\n");

    const resources = await listResources(library);

    expect(resources.find((resource) => resource.name === "broken")).toEqual({
      kind: "skill",
      name: "broken",
      description: undefined,
      problems: [
        'name "Broken" must be 1-64 characters of a-z, 0-9 and hyphens, without leading, trailing or double hyphens',
        "description is missing",
      ],
    });
  });

  it("lists a skill folder without SKILL.md as invalid", async () => {
    const library = await copyFixtureLibrary(await createSandbox());
    await mkdir(join(library, "skills/empty"));

    const resources = await listResources(library);

    expect(resources.find((resource) => resource.name === "empty")).toEqual({
      kind: "skill",
      name: "empty",
      description: undefined,
      problems: ["SKILL.md is missing"],
    });
  });

  it("fails with a clear message when the folder is not a library", async () => {
    const sandbox = await createSandbox();

    const result = listResources(sandbox.library);

    await expect(result).rejects.toThrow(ImAiError);
    await expect(result).rejects.toThrow(`No library at ${sandbox.library}: the skills/ folder does not exist.`);
  });
});

describe("createLibrary", () => {
  it("creates an empty library as a git repository with one commit", async () => {
    const sandbox = await createSandbox();

    await createLibrary(sandbox.library, { env: sandbox.env });

    expect(await listResources(sandbox.library)).toEqual([]);
    expect(await readFile(join(sandbox.library, "im-ai.json"), "utf8")).toBe("{}\n");
    expect(await gitOutput(sandbox, sandbox.library, ["log", "--format=%s"])).toBe("Initialize the im-ai library");
    expect(await gitOutput(sandbox, sandbox.library, ["ls-files"])).toBe("im-ai.json\nskills/.gitkeep");
    expect(await gitOutput(sandbox, sandbox.library, ["status", "--porcelain"])).toBe("");
  });

  it("refuses to write into a folder that is not empty", async () => {
    const sandbox = await createSandbox();
    const library = await copyFixtureLibrary(sandbox);

    const result = createLibrary(library, { env: sandbox.env });

    await expect(result).rejects.toThrow(ExistsError);
    await expect(result).rejects.toThrow(`The folder ${library} is not empty.`);
    expect(await readFile(join(library, "skills/commit-messages/SKILL.md"), "utf8")).toContain("name: commit-messages");
  });

  it("with overwrite, resets im-ai.json of an existing library, keeps its skills and history, and commits", async () => {
    const sandbox = await createSandbox();
    await createLibrary(sandbox.library, { env: sandbox.env });
    await writeFile(join(sandbox.library, "im-ai.json"), '{ "resources": {} }\n');
    await mkdir(join(sandbox.library, "skills/my-skill"));
    await writeFile(join(sandbox.library, "skills/my-skill/SKILL.md"), "---\nname: my-skill\ndescription: Mine.\n---\n");
    await gitOutput(sandbox, sandbox.library, ["add", "."]);
    await gitOutput(sandbox, sandbox.library, ["commit", "-m", "Add my-skill"]);

    await createLibrary(sandbox.library, { env: sandbox.env, overwrite: true });

    expect((await listResources(sandbox.library)).map((resource) => resource.name)).toEqual(["my-skill"]);
    expect(await readFile(join(sandbox.library, "im-ai.json"), "utf8")).toBe("{}\n");
    expect(await gitOutput(sandbox, sandbox.library, ["log", "--format=%s"])).toBe(
      "Initialize the im-ai library\nAdd my-skill\nInitialize the im-ai library",
    );
    expect(await gitOutput(sandbox, sandbox.library, ["status", "--porcelain"])).toBe("");
  });

  it("with overwrite, does not fail when the library has nothing to change", async () => {
    const sandbox = await createSandbox();
    await createLibrary(sandbox.library, { env: sandbox.env });

    await createLibrary(sandbox.library, { env: sandbox.env, overwrite: true });

    expect(await gitOutput(sandbox, sandbox.library, ["log", "--format=%s"])).toBe("Initialize the im-ai library");
  });

  it("refuses a path that is a file, even with overwrite", async () => {
    const sandbox = await createSandbox();
    await writeFile(sandbox.library, "not a folder");

    await expect(createLibrary(sandbox.library, { env: sandbox.env, overwrite: true })).rejects.toThrow(
      new ImAiError(`${sandbox.library} is a file, not a folder.`),
    );
  });
});
