# Narrative Layer v0

## Objetivo

La narrativa es un post-proceso del TurnPacket base. El runtime decide reglas de juego; la capa narrativa solo renderiza texto.

## Boundary fijo

1. `TurnEngine` produce `packetBase` (outcome/deltas/affordances cerrados).
2. `TurnsService` llama `NarrativeGateway.renderTurnNarrative(...)`.
3. Se construye `packetFinal` reemplazando solo `narrativeBlocks` (y estilizando `end.text` vía `PostalComposerService`).
4. Se persiste `packetFinal` en DB.

## Modos

- `NARRATIVE_MODE=placeholder`: usa texto determinista del engine.
- `NARRATIVE_MODE=llm`: intenta LLM y cae a fallback si falla.
- `NARRATIVE_MODE=hybrid`: misma ruta que `llm` en v0 (LLM first + fallback).

## Guardrails

- Estructura JSON estricta por schema (`validateNarrativePayload`).
- Límites de longitud/cantidad de bloques.
- Sanitizado básico (sin URLs, sin OOC, sin patrones prohibidos).
- Canon por IDs (`LOC_ID`, `HOTSPOT_ID`, `NPC_ID`, `ITEM_TAG`) validado contra contexto permitido.

Si cualquier guardrail falla: `reject + fallback`.

## Memoria y resúmenes

- `sessions.memoryJson`: bullets compactados (máx 10).
- `sessions.sceneSummaryJson`: resumen breve al cambiar escena/beat.
- `sessions.runSummaryJson`: resumen de run al llegar a ending.

## Telemetría

Eventos server persistidos:

- `narrative_rendered`
- `narrative_fallback`
- `guardrail_reject`
- `memory_updated`

## Config env (API)

- `NARRATIVE_MODE`
- `NARRATIVE_TIMEOUT_MS`
- `NARRATIVE_CACHE_SIZE`
- `LLM_ADAPTER=mock|http`
- `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (si `http`)
