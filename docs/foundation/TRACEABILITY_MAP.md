# Traceability Map

Spec-to-code quick map for maintenance.

| Foundation Spec    | Runtime/API Modules                                                                                                                                    | UI/Docs                                      | Tests                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------------------------ |
| 01 Concept         | `packages/runtime/src/engine/turn-engine.ts`, `apps/api/src/runtime/services/sessions.service.ts`, `apps/api/src/runtime/services/turns.service.ts`    | `apps/web/app/play/page.tsx`                 | `apps/api/src/runtime/runtime.persistence.int.spec.ts` |
| 04 Capsule Schema  | `packages/contracts/src/capsule-schema.ts`, `packages/contracts/src/schemas/capsule.zod.ts`                                                            | `docs/foundation/04_capsule_schema.md`       | `packages/capsule-lint/test/validators.spec.ts`        |
| 05 Action Model    | `packages/contracts/src/action-model.ts`, `packages/runtime/src/engine/action-resolver.ts`, `packages/runtime/src/engine/beat-validator.ts`            | `docs/foundation/05_action_model.md`         | `packages/runtime/test/action-resolver.spec.ts`        |
| 06 Turn Packet     | `packages/contracts/src/turn-packet.ts`, `packages/runtime/src/engine/turn-packet-builder.ts`                                                          | `docs/ui/UI_RUNTIME_MAPPING_v0.md`           | `packages/runtime/test/turn-engine.spec.ts`            |
| 07 Variability     | `packages/contracts/src/preset.ts`, `packages/runtime/src/engine/variability-applier.ts`, `apps/api/src/runtime/adapters/file-preset.provider.ts`      | `docs/variability/PRESETS_v0.md`             | `apps/api/src/runtime/runtime.persistence.int.spec.ts` |
| 08 Compatibility   | `packages/contracts/src/schemas/preset.zod.ts`, `packages/capsule-lint/src/validators.ts`                                                              | `docs/foundation/08_compatibility_matrix.md` | `packages/capsule-lint/test/validators.spec.ts`        |
| 10 Imponderables   | `packages/contracts/src/world-events.ts`, `packages/runtime/src/engine/world-event-director.ts`, `packages/runtime/src/engine/event-effect-applier.ts` | `docs/imponderables/WED_v0.md`               | `packages/runtime/test/world-event-director.spec.ts`   |
| Persistence (S03)  | `apps/api/prisma/schema.prisma`, `apps/api/src/modules/persistence/*.ts`                                                                               | `docs/data/PERSISTENCE_v0.md`                | `apps/api/src/runtime/runtime.persistence.int.spec.ts` |
| Debug (S07)        | `apps/api/src/runtime/debug.controller.ts`                                                                                                             | `apps/web/components/game/DebugDrawer.tsx`   | `apps/web/components/game/DebugDrawer.spec.tsx`        |
| Capsule Lint (S08) | `packages/capsule-lint/src/*.ts`                                                                                                                       | `docs/foundation/CAPSULE_LINT_RULES_v0.md`   | `packages/capsule-lint/test/*.spec.ts`                 |

## Change Guidance

- If Foundation schema changes: start in `packages/contracts`, then update runtime adapters, then update capsule-lint validators/tests.
- If runtime behavior changes: touch `packages/runtime` first, then API wiring in `apps/api`, then debug mapping in `apps/web`.
