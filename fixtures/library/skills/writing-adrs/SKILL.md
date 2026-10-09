---
name: writing-adrs
description: Record an architecture decision as a short ADR in docs/adr/. Use when a decision is hard to reverse, surprising without context, or the result of a real trade-off.
---

# Writing ADRs

An ADR is worth writing only when all three are true:

- The decision is hard to reverse.
- A new reader would be surprised without the context.
- There was a real trade-off between options.

## Format

Create `docs/adr/NNNN-<slug>.md` with the next free number.

- A title that states the decision.
- One paragraph: the context, the decision, and why.
- `## Considered options` only when the rejected options teach something.
- `## Consequences` for what the decision forces on the rest of the system.

Keep it short. One screen is the target.
