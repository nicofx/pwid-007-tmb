# World Imponderables Design v1 (Director del mundo sin patrón injusto)

## Objetivo

Agregar “imponderables” para evitar rutas deterministas (“siempre hago X y gano”),
sin caer en un patrón obvio (“siempre te cagan”) ni en RNG injusto.

La idea no es “castigar”, sino:

- introducir fricción contextual
- forzar recalcular
- mantener coherencia diegética

---

## 1) Principios

1. Los imponderables NO son solo negativos.
2. Deben ser coherentes con estado/época/acciones del jugador.
3. Deben respetar Truths, diales y compatibilidad.
4. Siempre dar feedback diegético (por qué pasó).
5. Mantener **presupuesto**, **mezcla** y **cooldowns**.

---

## 2) Tipos de imponderables (3 sabores)

### 2.1 A favor (help)

- llega un rumor útil
- alguien distrae sin querer
- aparece un acceso breve
- un NPC se apiada

### 2.2 Neutros (shift)

- cambia el ritmo del clock
- cambia quién está presente
- cambia la ubicación de atención
- se abre/cierra un hotspot

### 2.3 En contra (friction)

- aparece un tercero que observa
- sube sospecha por repetición
- se bloquea una ruta directa
- el antagonista endurece postura

Regla: por escena, como máximo:

- 1 evento fuerte, o
- 2 eventos suaves, o
- ninguno

---

## 3) World Event Director (WED)

Componente conceptual que decide por turno:

1. ¿corresponde disparar un evento ahora?
2. si sí, cuál evento, de qué sabor (help/shift/friction) y con qué intensidad?

El WED NO inventa outcomes arbitrarios: selecciona de un catálogo permitido por la cápsula/beat.

---

## 4) Control anti-patrón (para que no sea “siempre algo te caga”)

### 4.1 Event Budget

- por escena: máx 1 fuerte o 2 suaves
- por cápsula: máx 2 fuertes o 4 suaves
- cooldown: tras un fuerte, no permitir otro fuerte hasta X beats/turnos

### 4.2 Event Mix (mezcla)

Distribución objetivo por cápsula (default sugerido):

- 30% help
- 40% shift
- 30% friction

Si ya ocurrieron 2 friction, el próximo tenderá a help/shift.

### 4.3 Fairness (compensación)

Si un evento complica, debe ocurrir al menos una:

- abre ruta alternativa viable
- entrega clue/compensación
- reduce presión en otro frente

---

## 5) Triggers (condiciones) — sin RNG puro

Los eventos se disparan por:

- estado (sospecha/tensión/clock/riesgo)
- repetición (search spam / pressure spam / deceit spam)
- beats específicos (ventanas narrativas)
- diales (pace/trigger/antagonist)

Ejemplo de trigger:

- si `search_repeats >= 2` y tensión >= media → aparece observador (friction)
- si `clock=cerrándose` y no hay palanca → rumor útil (help)
- si `deceit_used >= 2` → NPC clave endurece (shift/friction)

---

## 6) Diminishing Returns (anti-minmax)

No es un “imponderable” externo, sino respuesta sistémica:

- repetir el mismo estilo 3 veces dentro de la cápsula:
  - sube atención más rápido
  - cierra un NPC
  - encarece una ruta

Siempre con explicación diegética:
“Te están midiendo.” / “Se corrió la voz.” / “Ya no te cree.”

---

## 7) Integración con el motor

El WED opera en el Turn Engine:

- puede insertar un `EVENT` block
- puede ajustar `stateText` (tensión/clock/sospecha)
- puede activar/desactivar hotspots
- puede introducir un NPC/observador (si está definido en cápsula)

Regla: el WED no contradice la resolución del Action Model.

---

## 8) Catálogo de eventos por cápsula

Cada cápsula debe declarar un set mínimo (8–12):

- 2–3 help
- 3–5 shift
- 2–3 friction
  con:
- beats donde pueden ocurrir
- triggers
- effects (deltas + affordances)

> Nota: esto se define en los archivos de cápsula, no aquí.
