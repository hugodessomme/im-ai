/**
 * The environment variables that the core uses (HOME, XDG_*, and the ones git reads).
 * The core never reads `process.env` itself: the frontend gives the environment, and tests give a sandbox.
 */
export type Env = Record<string, string | undefined>;
