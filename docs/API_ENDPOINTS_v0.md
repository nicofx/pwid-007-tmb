# API Endpoints v0

## Requisitos

- Header: `x-tmb-device-id: <uuid>` en endpoints de perfil/sesiones/turnos/history.

## Índice y salud

```bash
curl http://localhost:3001/
curl http://localhost:3001/health
curl http://localhost:3001/ready
curl http://localhost:3001/openapi.json
```

## Perfil

```bash
curl -H "x-tmb-device-id: 00000000-0000-4000-8000-000000000001" \
  http://localhost:3001/profile

curl -X PATCH \
  -H "Content-Type: application/json" \
  -H "x-tmb-device-id: 00000000-0000-4000-8000-000000000001" \
  -d '{"displayName":"Player"}' \
  http://localhost:3001/profile
```

## Sesiones

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-tmb-device-id: 00000000-0000-4000-8000-000000000001" \
  -d '{"capsuleId":"berlin-1933","presetId":"guided"}' \
  http://localhost:3001/sessions/start

curl -H "x-tmb-device-id: 00000000-0000-4000-8000-000000000001" \
  http://localhost:3001/sessions/<sessionId>/resume
```

## Turnos

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-tmb-device-id: 00000000-0000-4000-8000-000000000001" \
  -d '{"sessionId":"<id>","turnId":"turn-1","playerText":"observe officer"}' \
  http://localhost:3001/turns
```

## History / Export / Reset

```bash
curl -H "x-tmb-device-id: 00000000-0000-4000-8000-000000000001" \
  "http://localhost:3001/sessions/<sessionId>/turns?limit=200&fromSeq=0&includePacket=1"

curl -X DELETE \
  -H "x-tmb-device-id: 00000000-0000-4000-8000-000000000001" \
  http://localhost:3001/sessions/<sessionId>

curl -H "x-tmb-device-id: 00000000-0000-4000-8000-000000000001" \
  "http://localhost:3001/profile/export?includeTelemetry=0&turnLimitPerSession=200"

curl -X DELETE \
  -H "x-tmb-device-id: 00000000-0000-4000-8000-000000000001" \
  http://localhost:3001/profile
```

