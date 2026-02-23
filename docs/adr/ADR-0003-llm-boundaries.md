# ADR-0003: LLM Boundaries For Narrative Layer

## Estado

Accepted (Sprint S04)

## Contexto

El juego necesita narrativa flexible (LLM opcional) sin comprometer determinismo del runtime ni disponibilidad del endpoint `/turns`.

## Decisión

1. El runtime (`@tmb/runtime`) sigue puro y no conoce LLM.
2. El único punto de integración es `TurnsService` post-engine:
   - `packetBase` -> `NarrativeGateway` -> `packetFinal`.
3. La narrativa puede modificar solo:
   - `narrativeBlocks`
   - estilo de `end.text` (postal) sin alterar facts.
4. Cualquier error de LLM/guardrail/timeout cae a `PlaceholderNarrativeService`.
5. El packet persistido en DB es siempre el `packetFinal`.

## Consecuencias

- Si LLM cae o no está configurado, el juego sigue jugable.
- Cambiar proveedor (mock/http/futuro vendor) es configuración, no refactor del core.
- Métricas narrativas quedan auditables por sesión/turno.

## No permitido

- La narrativa no puede mutar outcome, deltas, affordances, stateText.
- La narrativa no puede inventar entidades fuera de canon permitido.
