---
name: code-review-checklist
description: Review a diff against a fixed checklist (correctness, tests, naming, error handling). Use when the user asks for a review of a branch, a pull request or staged changes.
metadata:
  author: fixture
  version: "1.0"
---

# Code review checklist

Read the full diff first. Then check each point and report only real problems.

1. **Correctness**: edge cases, empty inputs, error paths.
2. **Tests**: new behaviour has a test through a public interface.
3. **Naming**: names use the vocabulary of `CONTEXT.md`.
4. **Error handling**: errors give the user a clear next step.

See [the severity scale](references/severity.md) to rank each finding.
