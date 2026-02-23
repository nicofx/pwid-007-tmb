# DEMO S02

## Requisitos

- API y Web levantados (`pnpm dev`)
- Base URL API disponible para web (`NEXT_PUBLIC_API_URL`)

## Pasos

1. Abrir `http://localhost:3000/play`.
2. Presionar `Start Session` con `capsuleId=berlin-1933`.
3. Verificar render inicial de escena, stage, narrativa y estado.
4. Seleccionar un hotspot y un verbo.
5. Enviar turno desde Enter o botón.
6. Repetir al menos 5 turnos.
7. Verificar mini-map y acción MOVE cuando esté habilitada.
8. Activar debug: `http://localhost:3000/play?debug=1`.

## Verificaciones

- No se rompe el loop al enviar turnos seguidos.
- Se muestran errores legibles si API falla.
- Se registra telemetría de turnos y clicks en API (`POST /telemetry/client`).
