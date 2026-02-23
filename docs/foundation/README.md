# Take Me Back — Foundation

Este directorio es la **referencia absoluta** del proyecto Take Me Back (TMB).
Acá viven las decisiones funcionales, el motor, la estructura narrativa, la forma de jugabilidad y los artefactos de diseño.
**No es backlog técnico**, no es tareas, no es implementación: es la “constitución” del juego.

## ¿Qué es Take Me Back?

Un “viaje en el tiempo jugable”: entrás sin aviso a una situación histórica crítica, como un civil (o pieza menor),
con input libre (texto abierto), mundo coherente, consecuencias y finales etiquetados.
No es “resolver candados”: es navegar contexto, dilemas y costo.

## Principios clave (resumen)

- Formato MVP: **cápsulas** de 20–40 min.
- Estructura fija por cápsula: **3 escenas + 2 IU + 4 finales**.
- Input libre siempre (texto abierto); la UI sugiere acciones pero no obliga.
- No hay “win/lose” binario: hay **costo + legado + transformación**.
- Cada run es distinta por **variabilidad controlada** (diales + presupuestos + compatibilidad).
- Persistencia por turnos (turn log / historial) desde el core.
- Diseñado desde el inicio para futuro UGC (paquetes/versionado), aunque no sea MVP.

## Estructura de documentos

### Motor y reglas

- 01_concept.md — Concepto funcional completo
- 02_manifesto.md — 12 reglas del motor (no negociables)
- 03_traits_matrix.md — Perfil del jugador: impulsos, respuestas y tags
- 04_capsule_schema.md — Contrato: qué define una cápsula como datos
- 05_action_model.md — Acciones jugables (verb+target+modifiers) más allá del diálogo
- 06_turn_packet.md — Contrato de intercambio (turn request/response)
- 07_variability_spec.md — Diales + presupuesto + presets + reglas de unicidad
- 08_compatibility_matrix.md — Compatibilidad (evita combinaciones absurdas)
- 09_reward_retention_spec.md — Dopamina, micro-recompensas y postal final
- 10_world_imponderables_design.md — Imponderables: director del mundo (sin patrón “siempre te caga”)

### Cápsulas (contenido)

En `docs/foundation/capsules/` viven las cápsulas completas (diseño instanciado):

- C1933_ARREST_NIGHT.md — Berlín 1933 (piloto)
- C1914_SARAJEVO_CORNER.md — Sarajevo 1914 (evento abierto)
- C1898_PARIS_RADIUM_NIGHT.md — París 1898 (misterio científico)

### Roadmap (sin tareas)

En `docs/roadmap/`:

- BACKLOG_EPICS_v0.md — épicas, entregables y criterios de aceptación (sin tickets).

## Cómo usar esto

1. Si hay duda: **Foundation manda**.
2. Si aparece un conflicto: se ajusta Foundation y recién después backlog.
3. Si se agrega una cápsula: se instancia el Schema + Action/Hotspots + Beat Map + finales.
4. Si se cambia motor: actualizar Manifesto y el contrato de cápsula.

## Estado

Este Foundation se construyó en conversación y se está curando en archivos.
