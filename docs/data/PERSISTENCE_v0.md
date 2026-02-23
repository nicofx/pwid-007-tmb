# Persistence v0 (Sprint S03)

## Tablas

- `sessions`: estado derivado actual + meta de sesión.
- `turns`: log append-only por secuencia (`seq`).
- `snapshots`: checkpoint cada N turnos (`N=5`).
- `telemetry_events`: eventos server/client.

## Invariantes

- `turns` es append-only.
- `seq` es monotónico por `sessionId` (`@@unique([sessionId, seq])`).
- `turnId` es único por sesión (`@@unique([sessionId, turnId])`).
- `sessions.current_state_json` y `sessions.last_packet_json` son cache derivado del log.
- idempotencia de turno: mismo `(sessionId, turnId)` retorna el mismo `packet_json`.

## Snapshot policy

- snapshot en `seq=0` al crear sesión.
- snapshot cada 5 turnos (`SNAPSHOT_EVERY_TURNS`, default `5`).

## Retención sugerida

- `telemetry_events` crudo en dev: 30 días.
- producción: política configurable por entorno.

## Extensión segura

- nuevos `eventName` pueden agregarse sin migrar contrato de juego.
- nuevos campos de runtime pueden persistirse en JSONB (`request_json`, `packet_json`, etc.) sin romper append-only.
