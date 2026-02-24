# Device Profile v0 (sin login)

Fecha: 23 Feb 2026

## Objetivo

Dar identidad persistente por instalación sin auth real.

- identidad primaria: `deviceId` (header `x-tmb-device-id`)
- entidad persistida: `Profile`
- sesiones nuevas asociadas a `profileId`

## Modelo de datos

- `Profile`
  - `id`
  - `deviceId` (único)
  - `displayName`
  - `createdAt`, `updatedAt`
- `Session.profileId` (nullable para histórico; sesiones nuevas lo setean)
- `TelemetryEvent.profileId` opcional para correlación

## Contrato API

- `GET /profile`
  - upsert implícito por `deviceId`
  - default `displayName = "Player"`
- `POST /profile`
  - compat legacy (mismo comportamiento que PATCH)
- `PATCH /profile`
  - body `{ displayName }`
  - actualiza nombre del profile del `deviceId`
- `GET /profile/sessions?limit=10`
  - lista runs del profile (más nuevas primero)

## Regla de header

- Requests sin `x-tmb-device-id` retornan `400 DEVICE_ID_REQUIRED`
- Requests con `x-tmb-device-id` inválido retornan `400 DEVICE_ID_INVALID`
- Excepciones: rutas `/health` y `/admin/*`

## Flujo web

- Web genera/lee `deviceId` en localStorage (`tmb.device.id`)
- `apiClient` envía `X-Tmb-Device-Id` en requests no-admin
- `/lobby` permite:
  - ver/editar nombre
  - continuar última run
  - iniciar nueva run

## Límite actual

- No hay autenticación real: mover storage local a otro browser/dispositivo crea otro profile.

## Camino a login real (futuro)

1. agregar `User` (auth provider id)
2. asociar `Profile.userId` opcional
3. migrar sesiones por `profileId` sin romper compat
4. mantener `deviceId` como fallback para guest mode
