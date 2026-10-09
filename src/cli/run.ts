import { resolve } from "node:path";
import { parseArgs } from "node:util";
import type { Env } from "../core/env.ts";
import { ExistsError, ImAiError } from "../core/errors.ts";
import { init } from "../core/init.ts";
import { listResources } from "../core/library.ts";
import { readMachineConfig } from "../core/machine-store.ts";

export type Io = {
  env: Env;
  cwd: string;
  stdout: { write(text: string): unknown };
  stderr: { write(text: string): unknown };
};

const usage = `Usage:
  im-ai init --library <path> --agents <list> [--force]
      Create your library (a git repository) and the machine config.
      --agents is a comma-separated list of active agents: claude, codex.
      --force overwrites an existing machine config, and initializes a library folder that is not empty (its files are kept).
  im-ai list
      Show every skill in the library, with its description.
`;

/** A wrong command line. The CLI shows the message and the usage. */
class UsageError extends Error {}

/** Runs one im-ai command and returns the exit code. */
export async function run(argv: string[], io: Io): Promise<number> {
  try {
    await runCommand(argv, io);
    return 0;
  } catch (error) {
    if (error instanceof UsageError) {
      io.stderr.write(`im-ai: ${error.message}\n\n${usage}`);
      return 1;
    }
    if (error instanceof ExistsError) {
      io.stderr.write(`im-ai: ${error.message} Use --force to overwrite it.\n`);
      return 1;
    }
    if (error instanceof ImAiError) {
      io.stderr.write(`im-ai: ${error.message}\n`);
      return 1;
    }
    throw error;
  }
}

async function runCommand(argv: string[], io: Io): Promise<void> {
  const [command, ...args] = argv;
  switch (command) {
    case undefined:
    case "help":
    case "--help":
    case "-h":
      io.stdout.write(usage);
      return;
    case "init":
      return initCommand(args, io);
    case "list":
      return listCommand(args, io);
    default:
      throw new UsageError(`Unknown command "${command}".`);
  }
}

async function initCommand(args: string[], io: Io): Promise<void> {
  const { library, agents, force } = parseOptions(args, {
    library: { type: "string" },
    agents: { type: "string" },
    force: { type: "boolean" },
  });
  if (library === undefined) {
    throw new UsageError("init needs --library <path>.");
  }
  if (agents === undefined) {
    throw new UsageError("init needs --agents <list>, for example --agents claude,codex.");
  }

  const result = await init(
    {
      library: resolve(io.cwd, library),
      agents: agents
        .split(",")
        .map((agent) => agent.trim())
        .filter((agent) => agent !== ""),
      overwrite: force ?? false,
    },
    io.env,
  );
  io.stdout.write(`Created the library at ${result.library}\n`);
  io.stdout.write(`Wrote the machine config at ${result.machineConfig}\n`);
}

async function listCommand(args: string[], io: Io): Promise<void> {
  parseOptions(args, {});
  const config = await readMachineConfig(io.env);
  const resources = await listResources(config.library);
  if (resources.length === 0) {
    io.stdout.write("No skills in the library.\n");
    return;
  }

  const width = Math.max(...resources.map((resource) => resource.name.length));
  for (const resource of resources) {
    const text =
      resource.problems.length > 0 ? `INVALID: ${resource.problems.join("; ")}` : (resource.description ?? "");
    io.stdout.write(`${resource.name.padEnd(width)}  ${text}\n`);
  }
}

type Options = NonNullable<Parameters<typeof parseArgs>[0]>["options"] & {};

function parseOptions<T extends Options>(args: string[], options: T) {
  try {
    return parseArgs({ args, options, strict: true, allowPositionals: false }).values;
  } catch (error) {
    // parseArgs reports a wrong command line with an ERR_PARSE_ARGS_* code.
    if ((error as NodeJS.ErrnoException).code?.startsWith("ERR_PARSE_ARGS_")) {
      throw new UsageError((error as Error).message);
    }
    throw error;
  }
}
