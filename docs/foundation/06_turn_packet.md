# Turn Packet v1 (Contrato de interacción: request/response)

## Objetivo

Garantizar que la UI sea “juego” y no “chat”.
El servidor no devuelve texto suelto: devuelve un **paquete estructurado** por turno,
con narrativa + eventos + cambios de estado + affordances (hotspots/verbs) + IU + postal final.

---

## 1) TurnRequest (entrada)

Campos mínimos:

- `sessionId`
- `capsuleId`
- `turnId` (opcional en request; útil para idempotencia)
- `playerText` (string; siempre presente aunque sea vacío)
- `action` (opcional; acción estructurada si vino de UI)
  - `verb`
  - `targetType`
  - `targetId`
  - `modifiers[]`
- `optionalIntentHint` (opcional; si tocó chip: OBSERVE/SEARCH/etc. o estilo TALK)
- `clientMeta` (opcional)
  - `language`
  - `debug`
  - `uiMode` (desktop/mobile)

Regla: si `action` está presente, prima sobre inferencia de texto.

---

## 2) TurnResponse / TurnPacket (salida)

Campos:

### 2.1 Identidad

- `sessionId`
- `capsuleId`
- `turnId`

### 2.2 Escena

- `scene`
  - `sceneId` (A/B/C)
  - `title`
  - `locationTimeLabel`
  - `objectiveNow`

### 2.3 Visual / Mood (para game feel)

- `visual`
  - `backgroundKey`
  - `moodKey`
  - `sfxCue` (opcional)

### 2.4 Narrativa

- `narrativeBlocks[]` (lista ordenada)
  - `type`: NARRATION | DIALOGUE | EVENT | SYSTEM
  - `speaker` (si aplica)
  - `text`

### 2.5 NPCs presentes

- `npcsPresent[]`
  - `id`
  - `name`
  - `roleLabel`
  - `stateText` (hostil, nerviosa, te mide, etc.)

### 2.6 Estado humano (en palabras)

- `stateText`
  - `suspicion`: Invisible | Te miran | Marcado
  - `tension`: Baja | Media | Alta
  - `clock`: Ventana abierta | Cerrándose | Cerrada
  - `risk` (opcional): Seguro | Dudoso | Peligroso
  - `trustByNpc` (opcional)
    - `{ npcId: "No te cree|Duda|Te ayuda" }`

### 2.7 Deltas (para debug/telemetría)

- `stateDelta` (opcional)
  - cambios respecto al turno anterior (ej: suspicion +1)
- `leverageDelta` (opcional)
  - PRUEBA/ACCESO/ALIADO/DISTRACCIÓN ganada/perdida
- `inventoryDelta` (opcional)
- `clueDelta` (opcional)

### 2.8 Affordances (lo que puede hacer ahora)

- `affordances`
  - `activeLocations[]` (nodos)
  - `activeHotspots[]` (ids + labels cortas)
  - `allowedVerbs[]` (para el beat actual)
  - `suggestedActions[]` (chips opcionales, texto corto)

Regla: siempre devolver affordances; si no hay, el turno debe estar en IU o en ending.

### 2.9 IU (modo especial)

- `activeIU` (opcional)
  - `iuId`
  - `title`
  - `urgencyLabel`
  - `shortBrief`
  - `suggestedApproaches[]` (2–4)
  - `iuHotspots[]` (opcional; targets relevantes)

### 2.10 Ending / Postal final

- `end` (opcional; si la cápsula termina)
  - `endingTag` (Sobreviviente | El Gesto | El Rescate | Marcado)
  - `whatHappened[]` (3 bullets)
  - `cost[]` (1–2)
  - `legacy[]` (1–2)
  - `gainedTags[]` (2–4)
  - `unlocks[]` (0–2)
  - `replaySuggestions[]` (ej: “probá otro rol”)

---

## 3) Reglas de consistencia

1. Cada TurnPacket debe reflejar un avance: narrativa + delta o cambio de affordances.
2. No más de 2 turnos sin micro-recompensa (clue/palanca/estado/hotspot).
3. BLOCKED siempre incluye alternativas accionables.
4. Si `clock=Cerrada`, WAIT no debe aparecer en allowedVerbs.
5. Si `end` existe, no hay affordances jugables (solo UI de cierre).

---

## 4) Instrumentación mínima (para medir)

Por turno:

- verb/intent utilizado (inferido o explícito)
- outcomes (SUCCESS/PARTIAL/FAIL_FORWARD/BLOCKED)
- beatId (interno)
- abandono (si ocurre)
  Por sesión/run:
- variant_set (diales)
- endingTag alcanzado
- turn count por escena
