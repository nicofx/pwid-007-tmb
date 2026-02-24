# Edge Cases v0

Short list for rapid regression checks on Berlin 1933.

1. `BLOCKED` contract:

- Always returns alternatives with concrete `verb` and preferably `targetId`.

2. No dead-end beat:

- Any non-ending beat must expose >=2 usable options via hotspots/suggestions/locations.

3. Ending gating:

- Good ending requires both clue (`transport-list`) and leverage (`officer-habit`) plus clock gate.

4. Fail-forward fallback:

- If ending conditions are not met late game, progression still resolves to `detained-at-gate` path.

5. Session resume:

- Reload keeps same `sessionId` and recovers latest packet.

6. Idempotent turn replay:

- Repeating same `turnId` should return exact same packet.

7. Preset consistency:

- `presetId` from start is visible in resume and telemetry events.
