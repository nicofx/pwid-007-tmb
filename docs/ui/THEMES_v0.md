# Themes v0 (S20)

## Objetivo
Mantener una UI consistente, legible y con identidad de juego sin romper claridad funcional.

## Theme activo
- Nombre: `Noir Pulp`.
- Base: tokens en `apps/web/styles/tokens.css`.
- Tipografía:
  - UI: `Manrope`
  - Narrativa: `Plus Jakarta Sans`
  - Debug/JSON: `JetBrains Mono`

## Retro touches v0
Se aplican como utilidades reutilizables en paneles clave.

### `tmb-frame`
- Borde doble visual:
  - exterior: `1px solid var(--color-border)`
  - interior: `1px solid var(--color-panel2)` vía pseudo-elemento
- Radio: `10px`
- Sombra: `var(--shadow-medium)`

### `tmb-texture`
- Overlay de textura suave sobre background del panel.
- Opacidad fija: `0.06`.
- Regla: no afecta legibilidad de texto (`> *` con `z-index` superior).

## Outcome feedback
Se usa `OutcomeBadge` para diferenciar resultado en:
- `TurnSummaryBar`
- Timeline de `/history/[sessionId]`
- Inspector de turnos

Mapeo de colores:
- `SUCCESS` -> `success`
- `PARTIAL` -> `warning`
- `FAIL_FORWARD` -> `info`
- `BLOCKED` -> `danger`

## Estados globales
Componentes base en `apps/web/components/ui`:
- `LoadingState`
- `EmptyState`
- `ErrorState`

Regla: no dejar vistas vacías. Toda pantalla debe ofrecer contexto + CTA o acción de retry.

## Páginas aplicadas en S20
- `/play`
- `/history`
- `/history/[sessionId]`
- landing `/` y `/lobby` (venían de S19 y se mantienen)

## Checklist visual done
- No hardcodes de color nuevos fuera de tokens.
- Focus visible por teclado (`:focus-visible` + `--focus-ring`).
- Elementos interactivos con hit target cómodo (botones/tabs/chips).
- BLOCKED y SUCCESS distinguibles en menos de 1 segundo visual.
- Empty/error/loading con CTA en rutas críticas.
