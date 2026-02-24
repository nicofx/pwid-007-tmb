# WED v0

## Qué hace

`WorldEventDirector` evalúa y, opcionalmente, dispara un imponderable por turno luego de resolver outcome/deltas del action model.

Orden del pipeline:

1. Action/outcome/deltas base.
2. WED `maybeApply`.
3. Efectos WED sobre estado/affordances.
4. Packet final con `worldEvent` + `EVENT` block (si dispara).

No cambia `outcome` ya resuelto.

## Presupuesto y cooldown

Defaults por env:

- `WED_SCENE_STRONG_MAX=1`
- `WED_SCENE_SOFT_MAX=2`
- `WED_CAPSULE_STRONG_MAX=2`
- `WED_CAPSULE_SOFT_MAX=4`
- `WED_STRONG_COOLDOWN_TURNS=3`

Skip reasons:

- `WED_DISABLED`
- `NO_CANDIDATES`
- `BUDGET`
- `COOLDOWN`
- `MIX_CORRECTION`
- `ANTI_REPEAT`
- `FAIRNESS`

## Mix target

Default:

- help `0.3`
- shift `0.4`
- friction `0.3`

Si hay 2 friction seguidos, se corrige hacia help/shift cuando hay candidatos.

## DSL v0 (triggers)

`triggers.allOf[]` soporta:

- `state` (`suspicion|tension|clock|risk` con `gte|lte|eq`)
- `repetition` por `verb|target`
- `beat` (`beatId`, `sceneId`)
- `preset` (`requiredTag`, dial comparator)

## Effects v0

- `stateDelta`
- `toggleHotspots`
- `toggleLocations`
- `npcsDelta` (trust map keys)
- `addClue`, `addLeverage`

## Authoring checklist

1. Usar solo entidades del canon de cápsula.
2. Incluir `diegeticTextTemplate` corto.
3. Friction debe tener compensación (`fairnessCompensation` o clue/leverage/opción viable).
4. Probar con `pnpm --filter api test:integration`.
5. Verificar telemetría `imponderable_fired|imponderable_skipped`.
6. Verificar `wed_evaluated` por turno con snapshot de budgets/mix/cooldowns.
