import { mkdir, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Env } from "./env.ts";
import { ExistsError, ImAiError } from "./errors.ts";
import { isNotFound, readFileIfExists } from "./fs.ts";
import { git } from "./git.ts";
import { checkSkill } from "./skill.ts";

export type Resource = {
  kind: "skill";
  /** The folder name of the resource in the library. */
  name: string;
  description: string | undefined;
  /** Why the resource is invalid. Empty when the resource is valid. */
  problems: string[];
};

/**
 * Creates an empty library at `libraryPath`: a git repository with `skills/` and an empty `im-ai.json`, in one commit.
 * It refuses a folder that is not empty, unless `overwrite` is set. Then it adds only what is missing,
 * and keeps the existing files (`im-ai.json` included) and the git history.
 */
export async function createLibrary(libraryPath: string, options: { env: Env; overwrite?: boolean }): Promise<void> {
  const { env, overwrite = false } = options;
  const existingEntries = await readFolderIfExists(libraryPath);
  if (!overwrite && existingEntries !== undefined && existingEntries.length > 0) {
    throw new ExistsError(`The folder ${libraryPath} is not empty.`);
  }

  await mkdir(join(libraryPath, "skills"), { recursive: true });
  // git does not track empty folders.
  await writeFile(join(libraryPath, "skills/.gitkeep"), "");
  await writeFile(join(libraryPath, "im-ai.json"), "{}\n", { flag: "wx" }).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  });

  const files = ["im-ai.json", "skills/.gitkeep"];
  await git(libraryPath, ["init", "--quiet", "--initial-branch=main"], env);
  await git(libraryPath, ["add", ...files], env);
  const changed = await git(libraryPath, ["diff", "--cached", "--name-only", "--", ...files], env);
  if (changed !== "") {
    await git(libraryPath, ["commit", "--quiet", "-m", "Initialize the im-ai library", "--", ...files], env);
  }
}

/** Lists every resource of the library at `libraryPath`, sorted by name. */
export async function listResources(libraryPath: string): Promise<Resource[]> {
  const skillsDir = join(libraryPath, "skills");
  const entries = await readdir(skillsDir, { withFileTypes: true }).catch((error: unknown) => {
    if (isNotFound(error)) {
      throw new ImAiError(`No library at ${libraryPath}: the skills/ folder does not exist.`);
    }
    throw error;
  });
  const names = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  return Promise.all(
    names.map(async (name): Promise<Resource> => {
      const skillMd = await readFileIfExists(join(skillsDir, name, "SKILL.md"));
      if (skillMd === undefined) {
        return { kind: "skill", name, description: undefined, problems: ["SKILL.md is missing"] };
      }
      return { kind: "skill", name, ...checkSkill(name, skillMd) };
    }),
  );
}

async function readFolderIfExists(folder: string): Promise<string[] | undefined> {
  try {
    return await readdir(folder);
  } catch (error) {
    if (isNotFound(error)) return undefined;
    if ((error as NodeJS.ErrnoException).code === "ENOTDIR") {
      throw new ImAiError(`${folder} is a file, not a folder.`);
    }
    throw error;
  }
}
