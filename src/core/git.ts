import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { Env } from "./env.ts";
import { ImAiError } from "./errors.ts";
import { isNotFound } from "./fs.ts";

const execFileAsync = promisify(execFile);

/** Runs git in `cwd` and returns its standard output. */
export async function git(cwd: string, args: string[], env: Env): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, { cwd, env });
    return stdout;
  } catch (error) {
    if (isNotFound(error)) {
      throw new ImAiError("git is not installed or not in PATH. im-ai needs git.");
    }
    const { stderr } = error as { stderr?: string };
    throw new ImAiError(`git ${args[0]} failed in ${cwd}:\n${stderr?.trim() ?? String(error)}`);
  }
}
