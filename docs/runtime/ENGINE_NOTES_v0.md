# ENGINE_NOTES_v0

## Pipeline S01

1. Cargar cápsula (`ICapsuleProvider`).
2. Resolver acción (`ActionResolver`): explícita > heurística > fallback.
3. Validar contra beat (`BeatValidator`).
4. Resolver outcome (`OutcomeResolver`) con RNG seedable.
5. Aplicar deltas (`StateReducer`).
6. Avanzar beat/end (`BeatProgression`) con subset de reglas.
7. Construir affordances (`AffordancesBuilder`).
8. Construir `TurnPacket` (`TurnPacketBuilder`).
9. Emitir telemetría (`ITelemetrySink`).

## DSL soportado en S01

- `advanceRules[].onOutcomes`
- `advanceRules[].clockAtLeast`
- `advanceRules[].nextBeatId`
- `end.conditions.clockAtLeast`
- `end.conditions.requiresClues`
- `end.conditions.requiresLeverage`

## No soportado todavía

- Reglas complejas OR/NOT/nesting.
- Evaluación probabilística avanzada por traits.
- Persistencia de eventos y replay formal.

## Invariantes cubiertas

- `narrativeBlocks` nunca vacío.
- `BLOCKED` incluye alternativas accionables.
- `affordances` presentes salvo cuando existe `end`.
- Sin FAIL vacío: se usa `FAIL_FORWARD` o `PARTIAL`.
