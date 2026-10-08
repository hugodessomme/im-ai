# A headless TypeScript core, with the CLI before the TUI

All behaviour (library, origins, install, update, agent adapters) lives in a headless core written in TypeScript. The CLI, then the TUI, then perhaps a GUI are thin layers on top of it. We build the CLI first because commands are easy to test and easy for agents to implement, and the TUI then reuses the same core. TypeScript lets a future web or desktop GUI share the core, and npm gives a simple install for a second person.

## Considered options

- Go with Bubble Tea: one binary and excellent TUIs, but no shared code with a web GUI.
- Rust with Ratatui: very robust, but slower to write and to review.

## Consequences

- The TUI library (Ink, OpenTUI or other) is chosen later with a small prototype.
- Commands use general names (`install <resource>`, not `install-skill`), so new resource kinds do not change the CLI.
