# Usage Guide v0

## Qué es Take Me Back

Juego narrativo por turnos con estado persistente. Cada turno ejecuta:

`Action -> Outcome -> Deltas -> TurnPacket`

## Loop recomendado

1. Abrí `/lobby` y verificá perfil.
2. Iniciá run nueva o continuá la última.
3. En `/play`, elegí acción y enviá turno.
4. Revisá outcome y cambios de estado.
5. Repetí hasta ending o corte de escenario.

## Resultado de turno

- `SUCCESS`: avance favorable
- `PARTIAL`: avance con costo
- `FAIL_FORWARD`: no éxito pleno, pero el juego avanza
- `BLOCKED`: acción inválida para el beat actual

En `BLOCKED`, usar alternativas sugeridas.

## Presets, WED y narrativa

- Presets modifican riesgo/costos/densidad de ayudas.
- WED introduce imponderables con reglas de fairness.
- Narrativa puede venir de placeholder o LLM según configuración.

## Resume / Reset / Export

- Resume desde `/lobby` o `/history`.
- Delete run borra una sesión puntual.
- Wipe all reinicia perfil local.
- Export JSON descarga datos del perfil para backup/diagnóstico.

