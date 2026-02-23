# Action Model v1 (Acciones jugables más allá del texto)

## Objetivo

Permitir input libre (texto) y también interacción “de juego” (hotspots, mini-mapa),
traduciendo todo a una **Acción Jugable** consistente:

**verb + target + modifiers → outcome + state_delta + leverage_delta + narrative_blocks + next_affordances**

El motor decide outcomes por reglas; la narrativa “envuelve” el resultado.

---

## 1) Acción Jugable (estructura)

Una acción jugable tiene:

- `verb` (qué intentás hacer)
- `target` (sobre qué lo hacés)
  - `targetType`: LOCATION | HOTSPOT | ITEM | CLUE | NPC | GROUP | PATH | SYSTEM
  - `targetId`: id del objeto/nodo/hotspot/NPC
- `modifiers[]` (opcional): cómo lo hacés (sigilo, rápido, etc.)

---

## 2) Verbs MVP (10)

Set pequeño pero suficiente; extensible.

1. **MOVE** — ir a un LOCATION
2. **OBSERVE** — mirar un HOTSPOT/LOCATION/NPC
3. **LISTEN** — escuchar un HOTSPOT/LOCATION/NPC
4. **SEARCH** — revisar un HOTSPOT/LOCATION buscando ITEM/CLUE
5. **TAKE** — tomar un ITEM
6. **USE** — usar ITEM o HOTSPOT sobre un target
7. **HIDE** — esconderte o esconder ITEM
8. **FOLLOW** — seguir a un NPC o GROUP/PATH
9. **WAIT** — dejar pasar tiempo (si el beat lo permite)
10. **TALK** — hablar con un NPC (texto libre entra acá si es conversacional)

---

## 3) Modifiers MVP (6)

- **STEALTH** — sin que me vean
- **FAST** — rápido
- **CAREFUL** — con cuidado
- **LOUD** — haciendo ruido (puede servir para distracción)
- **ASSERTIVE** — firme/plantado (afecta TALK)
- **GENTLE** — suave/empático (afecta TALK)

> Nota: “mentir”, “negociar”, “presionar” se expresan como estilo dentro de TALK (más adelante se puede formalizar como sub-intents).

---

## 4) Outcomes estándar (4)

Toda acción devuelve uno:

- **SUCCESS**: lográs el objetivo
- **PARTIAL**: lográs algo pero pagás costo (sospecha/tensión/clock/relación)
- **FAIL_FORWARD**: no lográs eso, pero se dispara algo que avanza la historia (nuevo NPC/evento/ruta)
- **BLOCKED**: no se puede “ahora” (debe ofrecer alternativas accionables)

Regla: evitar “FAIL y nada”. Casi todo es PARTIAL o FAIL_FORWARD.

---

## 5) Estado humano (mínimo para v1)

El Action Model opera sobre estados textuales, no barras numéricas:

- **Sospecha/Atención**: Invisible / Te miran / Marcado
- **Tensión**: Baja / Media / Alta
- **Clock**: Ventana abierta / Cerrándose / Cerrada
- **Confianza por NPC clave**: No te cree / Duda / Te ayuda
- **Riesgo** (si aplica): Seguro / Dudoso / Peligroso
- **Palancas (Leverage)**: PRUEBA | ACCESO | ALIADO | DISTRACCIÓN (set booleano o contadores discretos)
- **Inventario liviano**: 0–3 items relevantes
- **Clues**: pistas registradas

---

## 6) Validación por Beat (affordances)

Cada beat define:

- `allowed_verbs[]`
- `active_hotspots[]`
- restricciones específicas (ej: WAIT prohibido)
- costo de repetición (ej: SEARCH repetido aumenta tensión)

Si el jugador intenta algo fuera del beat:

- outcome = BLOCKED
- explicación diegética corta
- 2 alternativas accionables ofrecidas (hotspots/verbs válidos)

---

## 7) Texto libre → Acción (interpretación)

El sistema intenta mapear texto a:

- verb + target + modifiers

Si no puede resolver con suficiente confianza:

- se degrada a:
  - TALK (si menciona NPC o intención social)
  - o SEARCH/OBSERVE en el location actual (si menciona “buscar/mirar” ambiguo)
- y la UI puede pedir desambiguación suave (“¿te referís a buzones o portería?”) sin cortar flow.

---

## 8) Anti-frustración y anti-spam

- **Diminishing returns por repetición**: repetir SEARCH/OBSERVE en el mismo beat consume clock y sube tensión.
- **Fail-forward obligatorio**: un fallo abre una ruta alternativa o un nuevo hotspot/evento.
- **Micro-recompensas**: no más de 2 turnos seguidos sin clue/palanca/cambio de estado/hotspot.

---

## 9) UI: cómo se siente juego

El Action Model habilita 4 formas de jugar:

1. texto libre
2. chips de acción (verbs)
3. hotspots clickables (targets)
4. mini-mapa de nodos (locations)

El motor devuelve siempre:

- hotspots activos (affordances)
- sugerencias opcionales
- deltas de estado visibles en palabras

---

## 10) Checklist de implementación (conceptual)

- ejecutar una acción estructurada sin IA (placeholder narrative)
- resolver outcomes determinísticamente + 1 “tirada discreta” opcional por beat
- devolver Turn Packet consistente (ver siguiente artefacto)
