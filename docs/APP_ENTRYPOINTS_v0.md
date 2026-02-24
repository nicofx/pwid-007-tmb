# App Entrypoints v0

## Web Routes

- `/` Landing + CTAs
- `/how-to` Guía de uso
- `/lobby` Perfil local + runs recientes
- `/play` Juego
- `/history` Historial de runs
- `/history/:sessionId` Timeline e inspector
- `/admin` Config dev (token)
- `/routes` Índice de rutas (dev)

## API Routes (principales)

- `GET /` índice API
- `GET /health` salud
- `GET /ready` readiness
- `GET /api/docs` Swagger UI
- `GET /openapi.json` spec OpenAPI

- `GET /profile`
- `PATCH /profile`
- `GET /profile/sessions`
- `GET /profile/export`
- `DELETE /profile`

- `POST /sessions/start`
- `GET /sessions/:id/resume`
- `GET /sessions/:id/turns`
- `DELETE /sessions/:id`

- `POST /turns`
- `POST /telemetry/client`

- `GET /admin/config`
- `POST /admin/config`
- `GET /admin/balance`

## Headers requeridos

- `x-tmb-device-id` UUID para endpoints de juego/perfil/historial.
- Excepciones: `/`, `/health`, `/ready`, `/api/docs`, `/openapi.json`, `/meta/routes`, `/admin/*`.

