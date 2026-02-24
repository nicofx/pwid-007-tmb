# Reset Protocol v0

Fecha: 23 Feb 2026

## Alcance

Este protocolo cubre dos operaciones destructivas:

- borrar una run (`DELETE /sessions/:id`)
- borrar todo el perfil local (`DELETE /profile`)

## Regla de seguridad

Nunca ejecutar delete sin:

1. confirmación explícita del usuario
2. ownership validado por `profileId`
3. transacción en backend

## Flujo recomendado en UI

### Delete run

1. Mostrar confirm dialog claro.
2. Ejecutar delete.
3. Refrescar listado.
4. Mostrar feedback de éxito/error.

### Wipe all

1. Pedir confirmación fuerte (typing `DELETE`).
2. Ejecutar delete profile.
3. Limpiar punteros locales (`tmb.play.session`, cache packet).
4. Redirigir a `/lobby`.

## Validaciones post-reset

- `GET /profile` debe recrear perfil nuevo (`id` distinto).
- `/history` debe mostrar vacío hasta crear nuevas runs.
- `/play` debe seguir operativo para iniciar sesión nueva.

## Eventos a verificar

- `run_deleted`
- `profile_wiped`
- `security_violation_attempt` (si hubo intento cross-device)

