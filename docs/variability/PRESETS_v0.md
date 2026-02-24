# Presets & Variability v0

## Dónde viven

- Archivo por cápsula: `docs/foundation/capsules/presets/<capsuleId>.presets.json`
- Ejemplo activo: `docs/foundation/capsules/presets/berlin-1933.presets.json`

## Shape

Cada preset usa `PresetDefinition` de `@tmb/contracts`:

- `id`, `label`, `description`
- `dials`: `riskTolerance`, `costSeverity`, `hintDensity`, `pacing` (0..1)
- `tags[]`

## Diales soportados v0

- `riskTolerance`: sesga el resultado hacia `SUCCESS/PARTIAL` o `FAIL_FORWARD`.
- `costSeverity`: escala costos de estado (suspicion/tension/clock).
- `hintDensity`: cantidad de alternativas/suggestedActions (1..4).
- `pacing`: reservado en tags/telemetría para evolución de progresión.

## Compat / Clamp

- Validación por schema zod (`validatePreset`).
- Clamp por dial con `clampPreset` (0..1).
- Si hay clamp se emite evento `preset_clamped`.
- Si `presetId` no existe: `400 PRESET_NOT_FOUND`.

## Runtime boundary

- El engine recibe preset como data (`SelectedPreset`), no lo carga de disco.
- Carga/lookup vive en API (`FilePresetProvider`).

## Presets Berlin 1933 (MVP)

- `default`: baseline balance.
- `guided`: higher hints, lower costs.
- `hardcore`: lower hints, higher costs, tighter success profile.
- `chaos-lite`: medium hints with swingier tempo/cost profile.

## QA smoke

API integration (`apps/api/src/runtime/runtime.persistence.int.spec.ts`):

- por cada preset de la cápsula: `start` + 10 turnos
- asserts: no 500, loop estable, packet válido.

CLI smoke runner (sin UI):

- `pnpm qa:presets`
- guía: `docs/qa/PRESET_QA_GUIDE_v0.md`
