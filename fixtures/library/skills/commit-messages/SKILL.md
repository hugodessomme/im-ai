---
name: commit-messages
description: Write git commit messages in the Conventional Commits format. Use when the user asks to commit, or to write or fix a commit message.
---

# Commit messages

1. Run `git diff --staged` and read the full change.
2. Pick one type: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`.
3. Write a subject of 72 characters or less, in the imperative mood, without a final period.
4. If the reason for the change is not clear from the subject, add a body that explains why, not how.

## Example

```
fix(install): keep the symlink relative

An absolute symlink breaks when a colleague clones the project
into a different folder.
```
