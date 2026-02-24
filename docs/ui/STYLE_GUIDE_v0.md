# Style Guide v0 (S19)

## Fundamentos
- Tema base: `Noir Pulp`.
- Fuente UI: `Manrope` (`--font-ui`).
- Fuente narrativa: `Plus Jakarta Sans` (`--font-serif`).
- Fuente debug/json: `JetBrains Mono` (`--font-mono`).
- Iconografía: wrapper único `Icon` sobre `lucide-react`.

## Tokens
Archivo: `apps/web/styles/tokens.css`.

### Colores
- `--color-bg`: `#0B0F14`
- `--color-panel`: `#121926`
- `--color-panel2`: `#182235`
- `--color-border`: `#2A3A55`
- `--color-text`: `#E8E1D5`
- `--color-muted`: `#A7B3C6`
- `--color-subtle`: `#6F7F98`
- `--color-accent`: `#C79A3B`
- `--color-accent2`: `#8F6B22`
- `--color-link`: `#74B3FF`
- `--color-success`: `#2FBF71`
- `--color-warning`: `#F2C14E`
- `--color-danger`: `#D14B4B`
- `--color-info`: `#4AA3DF`
- `--color-risk`: `#D14B4B`
- `--color-clock`: `#F2C14E`
- `--color-tension`: `#B57BFF`
- `--color-suspicion`: `#FF6B9E`

### Escalas
- Spacing: `--space-1..6` (`4/8/12/16/24/32px`)
- Radius: `--radius-sm/md/lg/pill`
- Sombra: `--shadow-soft`, `--shadow-medium`
- Focus ring: `--focus-ring`

## Tipografía
Archivo: `apps/web/styles/typography.css`.

Reglas:
- UI general en Manrope.
- Feed narrativo y bloques largos en Plus Jakarta Sans (estilo limpio, sin serif clásica).
- Debug overlays, JSON y `code/pre` en mono.

## Primitives (apps/web/components/ui)
- `Button` (variants: `primary|secondary|ghost|danger`, sizes `sm|md|lg`)
- `Panel` (`PanelHeader`, `PanelBody`, `PanelFooter`)
- `Badge`
- `Input`, `Textarea`
- `Select`
- `Tabs`
- `Modal`, `ConfirmModal`
- `ToastProvider`, `useToast`
- `Icon`

## Uso recomendado
1. No hardcodear colores en componentes; usar tokens.
2. Evitar importar `lucide-react` fuera de `Icon`.
3. Reusar primitives en páginas nuevas antes de crear estilos ad-hoc.
4. Para texto narrativo usar clases dentro de `.narrative-feed` o `.narrative-text`.
5. Cualquier acción destructiva debe pasar por `ConfirmModal`.

## Migración v0 ya aplicada
- Layout global con fuentes y theme.
- `AppHeader` y `AppFooter` migrados a primitives.
- Landing (`/`) y Lobby (`/lobby`) migrados como páginas piloto.
