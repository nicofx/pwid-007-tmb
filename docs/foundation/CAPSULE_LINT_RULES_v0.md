# Capsule Lint Rules v0

## Command

- All capsules: `pnpm capsule:lint`
- Single capsule: `pnpm capsule:lint -- --capsule berlin-1933`
- JSON report: `pnpm capsule:lint -- --format json`
- Strict mode (`WARN` also fails): `pnpm capsule:lint -- --strict`

## Severity

- `ERROR`: breaks build (exit 1)
- `WARN`: does not break build by default

## Rule Set

### Schema

- `CAPSULE_SCHEMA_INVALID` (`ERROR`)
  - Trigger: capsule JSON does not match contracts schema.
  - Fix: align with `packages/contracts/src/schemas/capsule.zod.ts`.

### Referential Integrity

- `DUPLICATE_ID` (`ERROR`)
  - Trigger: repeated ids for scenes/beats/hotspots/locations.
  - Fix: keep ids unique per entity type.
- `MISSING_REF` (`ERROR`)
  - Trigger: refs to unknown scene/beat/location/hotspot.
  - Fix: point refs to declared ids.
- `INVALID_TARGET` (`WARN`)
  - Trigger: preset file has ids not referenced by capsule list.
  - Fix: keep capsule preset list and preset file aligned.

### Gameplay Sanity (Static)

- `EMPTY_AFFORDANCES` (`ERROR`/`WARN`)
  - Trigger: beat has no verbs (`ERROR`) or too few options (`WARN`).
  - Fix: add verbs/hotspots/options.
- `NO_OPTIONS_DEAD_END` (`ERROR`)
  - Trigger: beat has no active hotspots and no ending.
  - Fix: add hotspots, IU path, or end condition.
- `SCENE_EMPTY` (`WARN`)
  - Trigger: scene without beats or missing entry text.
  - Fix: add at least one beat and entry text.

### Presets

- `PRESET_INVALID` (`ERROR`/`WARN`)
  - Trigger: invalid preset schema (`ERROR`) or missing preset file (`WARN`).
  - Fix: provide valid presets JSON.
- `PRESET_CLAMPED` (`WARN`)
  - Trigger: dial values outside `[0..1]`.
  - Fix: normalize dial values explicitly.
- `UNKNOWN_DIAL` (`WARN`)
  - Trigger: unsupported dial key.
  - Fix: use only `riskTolerance`, `costSeverity`, `hintDensity`, `pacing`.

### World Events

- `EVENT_SCHEMA_INVALID` (`ERROR`)
  - Trigger: invalid `worldEvents` shape.
  - Fix: align with `packages/contracts/src/schemas/world-events.zod.ts`.
- `EVENT_UNKNOWN_ID` (`ERROR`)
  - Trigger: event references unknown beat/scene/hotspot/location/npc.
  - Fix: use ids defined in capsule canon.
- `EVENT_TRIGGER_NOT_SUPPORTED` (`WARN`)
  - Trigger: unsupported/weak trigger semantics or clue/leverage not declared canonically.
  - Fix: tighten trigger definition and canonical lists.

## Typical Fix Examples

1. Broken hotspot ref:

- Symptom: `MISSING_REF` at `beats.N.activeHotspots.M`
- Fix: add hotspot in `hotspots[]` or change id in beat.

2. Dead-end beat:

- Symptom: `NO_OPTIONS_DEAD_END`
- Fix: add `activeHotspots` or define `end`.

3. Preset clamp warning:

- Symptom: `PRESET_CLAMPED`
- Fix: keep all dials in `0..1`.

4. Event inventing canon:

- Symptom: `EVENT_UNKNOWN_ID`
- Fix: replace unknown ids with declared capsule ids.
