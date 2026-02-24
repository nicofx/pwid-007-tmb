# Foundation Implementation Status

Date: February 23, 2026

This file tracks Foundation docs `01..10` against the current codebase reality.

## 01 Concept

- Status: ✅
- Implemented in:
  - `packages/runtime/src/engine/turn-engine.ts`
  - `apps/web/app/play/page.tsx`
- Notes:
  - Core loop `start session -> process turn -> render packet` is active.

## 02 Manifesto

- Status: 🟡
- Implemented in:
  - `packages/runtime/src/ports/interfaces.ts`
  - `apps/api/src/runtime/services/turns.service.ts`
- Notes:
  - Separation of concerns is in place (runtime pure, adapters in API).
  - Content/editorial policies are still partial and continue in later sprints.

## 03 Traits Matrix

- Status: 🟡
- Implemented in:
  - `packages/runtime/src/engine/outcome-resolver.ts`
  - `packages/runtime/src/engine/state-reducer.ts`
- Notes:
  - Outcome/cost dynamics are present.
  - Full balancing matrix remains iterative.

## 04 Capsule Schema

- Status: ✅
- Implemented in:
  - `packages/contracts/src/capsule-schema.ts`
  - `packages/contracts/src/schemas/capsule.zod.ts`
  - `docs/foundation/capsules/berlin-1933.json`
- Notes:
  - Static schema validation now exists in contracts and is reused by capsule-lint.

## 05 Action Model

- Status: ✅
- Implemented in:
  - `packages/contracts/src/action-model.ts`
  - `packages/runtime/src/engine/action-resolver.ts`
  - `packages/runtime/src/engine/beat-validator.ts`
- Notes:
  - Explicit action and heuristic fallback are both supported.

## 06 Turn Packet

- Status: ✅
- Implemented in:
  - `packages/contracts/src/turn-packet.ts`
  - `packages/runtime/src/engine/turn-packet-builder.ts`
  - `apps/web/viewmodels/turn-packet-vm.ts`
- Notes:
  - UI consumes packet contract directly.

## 07 Variability Spec

- Status: ✅
- Implemented in:
  - `packages/contracts/src/preset.ts`
  - `packages/contracts/src/schemas/preset.zod.ts`
  - `packages/runtime/src/engine/variability-applier.ts`
  - `apps/api/src/runtime/adapters/file-preset.provider.ts`
- Notes:
  - Presets are file-based and applied at runtime through safe dial subset.

## 08 Compatibility Matrix

- Status: 🟡
- Implemented in:
  - `packages/contracts/src/schemas/preset.zod.ts`
  - `apps/api/src/runtime/adapters/file-preset.provider.ts`
  - `packages/capsule-lint/src/validators.ts`
- Notes:
  - Clamp + warnings exist for current dial subset.
  - Full matrix coverage is still partial.

## 09 Reward Retention Spec

- Status: 🟡
- Implemented in:
  - `packages/runtime/src/engine/event-effect-applier.ts`
  - `apps/api/src/modules/persistence/telemetry.repo.ts`
  - `docs/data/PERSISTENCE_v0.md`
- Notes:
  - Basic deltas and telemetry persistence exist.
  - Long-horizon retention tuning remains pending.

## 10 World Imponderables Design

- Status: ✅
- Implemented in:
  - `packages/contracts/src/world-events.ts`
  - `packages/contracts/src/schemas/world-events.zod.ts`
  - `packages/runtime/src/engine/world-event-director.ts`
  - `packages/runtime/src/engine/budget-mix-policy.ts`
  - `docs/foundation/capsules/berlin-1933.json` (`worldEvents`)
- Notes:
  - WED budgets/mix/cooldown and fairness checks are active.

## Capsules

- `docs/foundation/capsules/berlin-1933.json`: ✅ Implemented and runtime-usable.
- Fixture coverage for lint/tests:
  - `fixtures/capsules/minimal_ok/minimal-ok.json`
  - `fixtures/capsules/invalid_refs/invalid-refs.json`
  - `fixtures/capsules/dead_end/dead-end.json`
  - `fixtures/capsules/duplicate_ids/duplicate-ids.json`

## Open Assumptions

- Capsule lint validates static integrity only; it does not execute engine simulation.
- Canon for clues/leverage/NPCs is partially inferred from current capsule model.
- Unsupported static checks are reported as warnings, not hard failures.
