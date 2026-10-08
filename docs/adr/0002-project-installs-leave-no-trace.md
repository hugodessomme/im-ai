# Project installs leave no trace of im-ai

A project install writes only the resource files into the project. There is no lock file, manifest or config from im-ai in the project. The machine registry (in `~/.config/im-ai`) records which projects hold which install, and the base version of each one. We chose this because a project must stay a normal project for colleagues, CI and other machines that do not know im-ai.

## Considered options

- A committed lock file in each project. Rejected: it adds im-ai to every project and is only useful to rebuild tracking on another machine, which is not a goal.

## Consequences

- Tracking is lost if the machine registry is lost or a project moves. The tool reports a missing project path; it does not try to rebuild the chain on another machine.
- Update, status and promote for project installs work only on the machine that did the install.
