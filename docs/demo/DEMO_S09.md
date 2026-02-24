# Demo S09

## Goal

Show Berlin 1933 as a coherent MVP play loop (not just technical plumbing).

## Setup

1. `docker compose up -d`
2. `pnpm dev`
3. Open `/play?debug=1`

## Demo Flow (10-15 min)

1. Start session with `default` preset.
2. Execute Core Scenario A from `docs/qa/SCENARIOS_BERLIN_1933_v0.md`.
3. Pause after 3-4 turns and show Debug Drawer:
   - Request source
   - Explain bullets
   - Diff panel deltas
4. Trigger one invalid action intentionally:
   - show `BLOCKED` + actionable alternatives.
5. Continue to ending (`escape-with-proof` preferred).
6. Show postal and restart option.

## What to Watch

- No empty affordances before ending.
- Objective phrasing remains clear via suggested reasons and beat text context.
- Deltas feel cumulative and coherent.

## What Not to Touch During Demo

- LLM mode toggles.
- DB resets mid-run.
- Manual edits to capsule files while dev server is serving live turns.
