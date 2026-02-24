# Admin Dev Panel v0

## Purpose

Dev-only runtime toggles for narrative gateway and basic runtime behavior without redeploy.

## Route

- Web: `/admin`
- API: `GET /admin/config`, `POST /admin/config`

## Auth

- Header: `X-Admin-Token`
- Expected value: `ADMIN_TOKEN` from API env
- If missing or invalid: `401`

## Supported Toggles

- `narrativeMode`: `placeholder | llm | hybrid`
- `llmAdapter`: `mock | http`
- `llmModel`: string
- `narrativeTimeoutMs`: integer (200..20000)
- `narrativeCacheSize`: integer (10..10000)
- `wedEnabled`: boolean

## Notes

- Config is stored in-process (`RuntimeConfigStore`), not persisted in DB.
- Changes apply to new requests immediately.
- `POST /admin/config` emits telemetry event `admin_config_changed`.
- This panel is dev-only and not suitable for production auth requirements.
