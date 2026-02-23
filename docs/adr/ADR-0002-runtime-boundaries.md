# ADR-0002: Runtime Boundaries (Core + Adapters)

## Estado

Accepted - 2026-02-23

## Contexto

El core runtime debe evolucionar sin acoplarse a Nest/Next/DB y soportar reemplazo de providers (narrativa, cápsulas, telemetría, RNG).

## Decisión

- `packages/runtime` contiene dominio, puertos e implementación del `TurnEngine`.
- `packages/runtime` no depende de IO ni de frameworks.
- `apps/api` implementa adapters concretos:
  - `FileCapsuleProvider`
  - `PlaceholderNarrativeProvider`
  - `InMemoryTelemetrySink`
- La sesión y la idempotencia (`turnId -> TurnPacket`) viven in-memory en `apps/api` detrás de `SessionStore`.

## Consecuencias

- Migrar storage/telemetry a Postgres (S03) no requiere reescribir el engine.
- Integrar IA en narrativa (S04) se resuelve reemplazando `INarrativeProvider`.
- Director de imponderables (S06) entra como nuevo port/componente sin romper endpoints.
