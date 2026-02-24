# Berlin 1933 QA Scenarios v0

Date: February 23, 2026

Conventions:

- `verb -> target`
- Expected outcome means likely result under normal run, not guaranteed RNG branch.
- If blocked, verify alternatives are concrete and include valid target ids.

## Core Scenarios (3)

### Core A — Stealth Escape (good ending)

Goal: reach `escape-with-proof` in <= 20 turns.

1. `OBSERVE -> courier-contact`
2. `TALK -> officer` (aim to gain `officer-habit` leverage)
3. `SEARCH -> service-door`
4. `MOVE -> service-door` (progress to archive)
5. `SEARCH -> records-ledger` (aim clue `transport-list`)
6. `OBSERVE -> sleeping-clerk`
7. `SEARCH -> stamp-desk`
8. `MOVE -> courtyard-exit`
9. `OBSERVE -> tram-platform`
10. `MOVE -> courtyard-exit` (final crossing)

Expected:

- Reach `clean-exit` beat and trigger ending `escape-with-proof` when clue+leverage+clock conditions are met.

### Core B — Social Route

Goal: advance mostly through TALK/OBSERVE and still exit.

1. `TALK -> officer`
2. `TALK -> courier-contact`
3. `OBSERVE -> service-door`
4. `MOVE -> archive-lock` or `MOVE -> service-door`
5. `OBSERVE -> sleeping-clerk`
6. `TALK -> sleeping-clerk`
7. `SEARCH -> records-ledger`
8. `TALK -> tram-platform`
9. `MOVE -> courtyard-exit`

Expected:

- Progression completes without dead-end.
- If ending conditions are missing, flow can fail-forward to `detained-at-gate`.

### Core C — Investigative Route

Goal: maximize clues and verify pacing consistency.

1. `SEARCH -> archive-lock`
2. `SEARCH -> service-door`
3. `SEARCH -> records-ledger`
4. `SEARCH -> filing-cabinet`
5. `SEARCH -> stamp-desk`
6. `OBSERVE -> sleeping-clerk`
7. `OBSERVE -> tram-platform`
8. `MOVE -> courtyard-exit`

Expected:

- Clue/inventory deltas visible in debug.
- No zero-option beat.

## Edge Scenarios (7)

### Edge 1 — Invalid Verb Spam

- Send 5 turns with disallowed verb for current beat (for example `DROP`).
- Expect every response: `outcome=BLOCKED` + 2-4 alternatives with valid verbs/targets.

### Edge 2 — Invalid Target Loop

- Send `SEARCH -> not-a-target` three times.
- Expect `BLOCKED` with alternatives referencing active hotspots.

### Edge 3 — MOVE Loop

- Repeatedly `MOVE` between available targets on `exfiltration`.
- Verify clock/tension/risk increase is gradual, not spiky.

### Edge 4 — Repeat Same Risky Action

- Repeat `SEARCH -> archive-lock` several times in early beats.
- Verify repeat penalties and fail-forward behavior (no hard stop).

### Edge 5 — Resume Mid-Run

- Play 6+ turns, refresh, resume from `/play`.
- Verify packet + progression + debug history remain consistent.

### Edge 6 — Preset Swap Between Sessions

- Start one run with `guided`, one with `hardcore`.
- Verify different feel in suggestion density/costs, and `presetId` persisted.

### Edge 7 — WED Presence/Skip Explain

- In debug mode, verify turns show WED fired/skip reasons without breaking packet shape.

## Debug Sidecar Checklist (S07)

On each scenario, review:

1. `Request` tab: verb/target/source are what UI sent.
2. `Explain` tab: blocked reasons and suggested next moves are actionable.
3. `Diff` tab: state deltas are coherent with action risk/repetition.
4. `Raw JSON` tab: packet includes scene/visual/narrative/state/affordances unless end.
