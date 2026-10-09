// Safety net: no test may read or write the real HOME, even by mistake.
// Each test still gets its own sandbox from `createSandbox`.
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const home = mkdtempSync(join(tmpdir(), "im-ai-home-"));
process.env.HOME = home;
process.env.XDG_CONFIG_HOME = join(home, ".config");
process.env.XDG_DATA_HOME = join(home, ".local/share");
process.env.XDG_STATE_HOME = join(home, ".local/state");
process.env.XDG_CACHE_HOME = join(home, ".cache");
