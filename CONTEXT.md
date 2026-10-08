# im-ai

im-ai lets a person keep their own agent-agnostic collection of AI resources (skills first) in one place, and install them into coding agents globally or into projects. It also keeps those copies up to date with where they came from.

## Language

### Collection

**Library**:
A person's own git repository that holds their resources. It is the single source of truth for those resources. Each person has their own library; the im-ai tool is not part of it.
_Avoid_: Stock, catalog, resource repo, vault

**Resource**:
One item in a library that an agent can use. Every resource has a kind.
_Avoid_: Asset, item, artifact

**Resource kind**:
The type of a resource. In v1 the only kind is skill. Planned kinds: `AGENTS.md`/`CLAUDE.md` instructions, subagents.

**Skill**:
A resource in the open Agent Skills format: a folder with a `SKILL.md` file.

**Pack** _(planned)_:
A named set of resources that you install together, with the option to pick only some of them (example: "frontend project").
_Avoid_: Bundle, preset, template

### Where copies come from

**Origin**:
The place a copy came from, plus the version it had when it was copied. A library resource can have an upstream as its origin. A project install has the library as its origin.
_Avoid_: Link, source, parent

**Upstream**:
An external git repository (for example on GitHub) that a library resource was imported from.
_Avoid_: Remote, original repo

**Base version**:
The version of the origin at the moment of the copy. An update compares the base version, the current copy, and the new origin version.
_Avoid_: Snapshot, pinned version

**Diverged**:
Said of a copy that changed after its base version.
_Avoid_: Dirty, forked

**Outdated**:
Said of a copy whose origin has a newer version than its base version.
_Avoid_: Stale, behind

**Intent note**:
A short text, attached to a library resource, that says why the person diverged from the upstream. An agent writes it during a resolution session.
_Avoid_: Changelog, comment

### Actions

**Import**:
To copy a resource from an upstream into the library and record its origin.
_Avoid_: Fetch, download, add

**Install**:
To place a copy of a library resource where an agent reads it. An install is either global or project.
_Avoid_: Deploy, link, add

**Global install**:
An install at user level, visible to the agent in every project on the machine. It always reflects the current library version.

**Project install**:
An install inside one project, as plain files that the project commits. It contains no trace of im-ai.
_Avoid_: Vendored skill, scoped skill

**Update**:
To bring the changes of an origin into a copy. This applies to both upstream → library and library → project install.
_Avoid_: Sync, pull, upgrade

**Promote**:
To bring a change made in a project install back into the library.
_Avoid_: Push, upstream (as a verb), back-port

**Conflict**:
A situation where an update cannot combine the changes of the origin and the changes of the copy without a decision.

**Resolution session**:
An interactive session with an agent, started by the person, to resolve a conflict.
_Avoid_: AI merge, auto-resolve

### Machine and agents

**Agent**:
A coding agent that reads resources, for example Claude Code or Codex.
_Avoid_: Assistant, AI tool, harness

**Active agents**:
The agents that im-ai installs resources for on a machine.

**Agent adapter**:
The knowledge of where and how one agent reads each resource kind.
_Avoid_: Driver, plugin, provider

**Machine config**:
The per-machine settings of im-ai: library location, active agents, default agent for resolution sessions, authoring skill.
_Avoid_: Settings, profile

**Machine registry**:
The per-machine record of global installs and of the projects that hold each project install, with their base versions.
_Avoid_: Lock file, index, database

**Authoring skill**:
The skill that guides an agent when the person creates a new resource. It is a library resource, chosen in the machine config.
_Avoid_: Template, generator
