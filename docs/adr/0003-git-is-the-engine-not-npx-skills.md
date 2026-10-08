# Git is the engine, not `npx skills`

We use `git` directly to import from upstreams (partial or sparse clone) and to merge updates (`git merge-file`), and we keep our own small agent adapter table. We do not build on the `skills` CLI from Vercel (`npx skills`), although it already imports skills and installs them for many agents. Its `update` skips local-path sources, it has no merge of local changes with upstream changes, and it has no packs or authoring flow. Making it the foundation would block these features. The library is already a git repository, so git is a stable dependency we need anyway.

## Consequences

- External tools may still help at the edges (for example `npx skills find` to discover skills), but no feature may depend on them.
- The library history is the source of base versions, so the tool commits its own actions (import, update, promote) in the library. The person commits their manual edits.
