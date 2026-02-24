# Demo Playtest v0 (S13)

Date: February 23, 2026

## Goal

Run a 10-15 minute human playtest where the player can start, follow guidance, recover from blocked turns, and reset the run without developer help.

## Setup

1. `docker compose up -d`
2. `pnpm dev`
3. Open `http://localhost:3000/play?debug=1`

## Script (for Bauti)

1. In start screen, keep `Capsule=berlin-1933`.
2. Pick scenario `Core A - Stealth Escape`.
3. Keep `Demo mode` enabled (seed `demo-berlin-1933`).
4. Click `Start Session`.
5. For 8-10 turns, use `Try this` from Guided Play at least 5 times.
6. Intentionally trigger 1 blocked action (invalid verb/target), then recover using `Blocked` chips.
7. Trigger `Reset Run` once and verify it starts turn 0 again with same scenario/preset/seed.
8. Continue until ending or at least 10 turns.

## What to observe

- Turn feedback is visible (`Processing...` + latency ms).
- Enter submits actions from input.
- Esc closes debug drawer and IU modal.
- BLOCKED state always shows short reason + clickable alternatives.
- Guided suggestion is actionable in current affordances.
- Reset returns to fresh run without stale timeline confusion.

## Debug checks

- Debug drawer Request tab: verb/target/source match UI interactions.
- Diff tab: deltas move coherently with chosen actions.
- Explain tab: blocked turns explain what to try next.
- Capsule Overview button loads scene/beat/hotspot tree.
