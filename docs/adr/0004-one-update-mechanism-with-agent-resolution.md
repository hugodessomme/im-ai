# One update mechanism, with conflicts resolved in an interactive agent session

Upstream → library and library → project install use the same update: a three-way merge of the base version, the current copy and the new origin version. When the merge cannot finish without a decision, the tool does not try to be smart. It tells the person that the conflict is not simple, and offers to start a resolution session with one of the active agents (for example `claude` or `codex`), in the terminal, with the three versions and the intent note ready. We chose an interactive agent CLI over calling a model API because the person must make the decisions, it needs no API key, and it works with any agent that has a CLI.

## Consequences

- The tool starts the agent with a prompt that tells it to read and follow a skill file by path. This works the same way for every agent, whether or not that skill is installed.
- The resolution skill and the authoring skill are library resources chosen in the machine config, with a minimal fallback bundled in the tool.
- The agent writes or updates the intent note at the end of a resolution session. The person never has to write it.
