import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { onTestFinished } from "vitest";
import { run } from "../src/cli/run.ts";

const execFileAsync = promisify(execFile);

export const fixtureLibrary = join(import.meta.dirname, "../fixtures/library");

export type Sandbox = {
  root: string;
  home: string;
  /** A folder for the library. It does not exist yet. */
  library: string;
  project: string;
  /** The environment to give to the core and the CLI. It never points to the real HOME. */
  env: Record<string, string>;
};

/** Temporary folders for one test. They are removed when the test ends. */
export async function createSandbox(): Promise<Sandbox> {
  const root = await realpath(await mkdtemp(join(tmpdir(), "im-ai-test-")));
  onTestFinished(() => rm(root, { recursive: true, force: true }));

  const home = join(root, "home");
  const project = join(root, "project");
  await mkdir(home);
  await mkdir(project);

  return {
    root,
    home,
    library: join(root, "library"),
    project,
    env: {
      PATH: process.env.PATH ?? "",
      HOME: home,
      XDG_CONFIG_HOME: join(home, ".config"),
      XDG_DATA_HOME: join(home, ".local/share"),
      XDG_STATE_HOME: join(home, ".local/state"),
      XDG_CACHE_HOME: join(home, ".cache"),
      GIT_CONFIG_NOSYSTEM: "1",
      GIT_AUTHOR_NAME: "Test",
      GIT_AUTHOR_EMAIL: "test@example.com",
      GIT_COMMITTER_NAME: "Test",
      GIT_COMMITTER_EMAIL: "test@example.com",
    },
  };
}

/** Copies the fixture library into the sandbox library folder. */
export async function copyFixtureLibrary(sandbox: Sandbox): Promise<string> {
  await cp(fixtureLibrary, sandbox.library, { recursive: true });
  return sandbox.library;
}

/** Runs git in `cwd` with the sandbox environment and returns its trimmed output. */
export async function gitOutput(sandbox: Sandbox, cwd: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", args, { cwd, env: sandbox.env });
  return stdout.trim();
}

export type CliResult = { code: number; stdout: string; stderr: string };

/** Runs the CLI in-process, in the sandbox, and captures its output. */
export async function runCli(sandbox: Sandbox, args: string[], options: { cwd?: string } = {}): Promise<CliResult> {
  let stdout = "";
  let stderr = "";
  const code = await run(args, {
    env: sandbox.env,
    cwd: options.cwd ?? sandbox.project,
    stdout: { write: (text) => (stdout += text) },
    stderr: { write: (text) => (stderr += text) },
  });
  return { code, stdout, stderr };
}
