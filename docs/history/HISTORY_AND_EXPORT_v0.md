# History & Export v0

Fecha: 23 Feb 2026

## Objetivo

Dar herramientas locales de producto para revisar runs, exportar datos y resetear de forma segura, siempre scopeado por `deviceId -> profileId`.

## Endpoints

- `GET /sessions/:id/turns?limit=200&fromSeq=0&includePacket=1`
  - devuelve timeline de turnos ordenado por `seq`
  - valida ownership de la sesión antes de responder
- `DELETE /sessions/:id`
  - hard delete de una run:
    - `turns`
    - `snapshots`
    - `telemetry_events` por `sessionId`
    - `session`
- `GET /profile/export?includeTelemetry=0&turnLimitPerSession=200`
  - export JSON con:
    - `profile`
    - `sessions`
    - `turnsBySession` (limitado)
    - `snapshotsBySession` (latest)
    - `telemetry` opcional
- `DELETE /profile`
  - hard reset completo:
    - sesiones del profile + turns/snapshots/telemetry asociada
    - telemetry ligada a `profileId`
    - profile

## Ownership guard

Regla central:

- `assertSessionOwned(sessionId, profileId)`
- Si la sesión no pertenece al profile actual:
  - evento `security_violation_attempt`
  - respuesta opaca `SESSION_NOT_FOUND` (404)

## Eventos de observabilidad

- `history_turns_listed`
- `run_deleted`
- `profile_exported`
- `profile_wiped`
- `security_violation_attempt`

## UI

- `/history`
  - lista runs del profile
  - acciones: abrir, reanudar, eliminar, exportar, borrar todo
- `/history/[sessionId]`
  - timeline + mini inspector (incluye raw packet colapsable)

## Límites v0

- `limit` de turns: máximo 200 por request
- `turnLimitPerSession` en export: máximo 500
- telemetry en export: opt-in (`includeTelemetry=1`)

