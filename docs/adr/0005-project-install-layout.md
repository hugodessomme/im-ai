# Project install layout: one copy in `.agents/skills`, a symlink for Claude Code

A project install of a skill writes the files once into `.agents/skills/<name>/` and adds `.claude/skills/<name>` as a relative symlink to `../../.agents/skills/<name>`. `.agents/skills` is the shared location that Codex and most agents read. Claude Code reads only `.claude/skills`, so it needs the symlink. Both are committed as normal files. One copy means no drift between agents inside a project.

## Considered options

- One full copy per agent. Rejected as the default because the copies can drift. It stays available as a fallback for projects that must work on Windows, where symlinks work badly.

## Consequences

- Global installs follow the same idea with symlinks from `~/.agents/skills/` and `~/.claude/skills/` to the library.
- Each agent adapter declares where it reads each resource kind. A new agent is a new adapter entry.
