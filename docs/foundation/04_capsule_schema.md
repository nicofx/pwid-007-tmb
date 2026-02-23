# Capsule Schema v1 (Contrato genérico de cápsula)

## Objetivo

Definir una cápsula como un **paquete de datos + reglas** que el motor puede ejecutar sin reprogramarse.
Una cápsula es: escenas + beats + IU + finales + diales + hotspots + compatibilidad.

> Este documento define el “molde” genérico. Cada cápsula es una instancia de este esquema.

---

## 1) Principios de diseño (MVP)

- Duración objetivo: **20–40 min**.
- Estructura fija: **3 escenas + 2 IU + 4 finales etiquetados**.
- Input libre siempre, con acciones jugables (Action Model).
- Siempre hay cierre (nunca “te quedaste sin contenido”).
- Variabilidad controlada: diales + presupuesto + compatibilidad.
- Final = costo + legado + transformación (postal).

---

## 2) Secciones obligatorias del paquete

### 2.1 Metadata

Campos:

- `capsule_id` (único)
- `title`
- `era_location_label`
- `theme_tags[]`
- `tone_tags[]`
- `target_duration_min`
- `difficulty_profile` (STANDARD/HARD/STORY)
- `schema_version` (v1)

### 2.2 Truths (inamovibles)

Lista de 3–7 verdades:

- `truth_id`
- `description`
- `scope` (GLOBAL/SCENE)

Regla: si cambia una Truth, probablemente sea **otra cápsula**, no una variante.

### 2.3 Roles (D1)

Cada rol define:

- `role_id`
- `name`
- `start_context` (1–3 líneas)
- `access_rules` (qué nodos/hotspots son más plausibles)
- `risk_profile` (sospecha inicial textual)
- `start_assets` (opcional; máx 1–2 items/ventajas narrativas)

### 2.4 Dials (variabilidad) + valores permitidos

La cápsula lista los diales soportados (subset de D1–D10) y por cada dial:

- `dial_id`
- `values[]` (id/label/brief)
- `affects`:
  - `beats[]` (qué beats toca)
  - `iu[]` (qué IU toca)
  - `endings[]` (qué finales toca)
- `compatibility_rules_ref`

Regla: cada dial debe afectar al menos 1 beat observable.

### 2.5 Budget

- `budget_structural_max` (default 2)
- `budget_medium_max` (default 3)
- `budget_soft_max` (default 2)
- `max_total_dials_changed` (default 7)

### 2.6 Presets (demo/QA)

2–4 presets:

- `preset_id`
- `name`
- `dial_value_map`
- `expected_feel`

---

## 3) Escenas (Scenes)

Tres escenas mínimas:

Para cada escena:

- `scene_id` (A/B/C)
- `title`
- `location_time_label`
- `objective_now`
- `background_key` (para UI)
- `mood_key` (para UI/sonido)
- `entry_text` (2–6 líneas)
- `exit_conditions` (beats/IU/clock)

---

## 4) Beat Map (columna vertebral)

Una cápsula se define como una secuencia de beats.

Cada beat:

- `beat_id` (B0..Bn)
- `scene_id`
- `title`
- `what_happens` (1–4 líneas)
- `player_goal_now` (1 línea)
- `actionables[]` (acciones no-discursivas sugeridas)
- `allowed_verbs[]` (Action Model)
- `active_hotspots[]` (qué targets existen ahora)
- `dial_influence[]` (qué diales modifican este beat)
- `advance_rules`:
  - por clock
  - por acción/outcome
  - por estado

Regla: no más de 2 beats seguidos sin micro-recompensa tangible (clue/palanca/estado/hotspot).

---

## 5) IU (Unidades Interactivas)

Dos IU mínimas por cápsula.

Cada IU:

- `iu_id`
- `title`
- `urgency_label` (si aplica)
- `trigger_beats[]`
- `short_brief` (2–4 líneas)
- `approaches[]` (2–4 enfoques viables)
- `success_outputs` (palancas + estados + clues/items)
- `failure_outputs` (fail-forward, nunca “nada”)
- `dial_influence[]`
- `links_to_endings` (qué finales habilita/encarece)

---

## 6) Endings (finales etiquetados)

MVP: 4 finales.

Cada ending:

- `ending_id`
- `ending_tag_label` (Sobreviviente / El Gesto / El Rescate / Marcado)
- `conditions` (combinación de palancas + estados + decisiones)
- `postal_template`:
  - `what_happened[]` (3 bullets)
  - `cost[]` (1–2)
  - `legacy[]` (1–2)
  - `gained_tags[]` (2–4)
  - `unlocks[]` (0–2)

Regla: toda run termina en un ending.

---

## 7) Hotspots + Items + Clues (acción más allá del texto)

Cada cápsula define:

### 7.1 Locations (nodos)

Lista de `location_id` (3–8 ideal MVP) + conexiones (mapa de nodos).

### 7.2 Hotspots

Cada hotspot (interactuable) define:

- `hotspot_id`
- `type` (INTERACTABLE/OBJECT/NPC/GROUP/PATH)
- `visible_in_beats[]`
- `verbs_allowed[]`
- `outputs_possible` (clues/items/leverage/state)
- `risk_profile` (LOW/MEDIUM/HIGH)
- `failure_mode` (PARTIAL/FAIL_FORWARD/BLOCKED)
- `activation/deactivation` conditions

### 7.3 Items (inventario liviano)

Máx recomendado MVP: 1–3 items relevantes.

### 7.4 Clues

Pistas registrables (no siempre objetos).

---

## 8) Instrumentation (mínimo medible)

- `variant_set` (diales elegidos)
- beats alcanzados
- outcomes de IU
- ending alcanzado
- abandono (scene/beat)
- histograma de jugadas (intents/verbs)

---

## 9) Compatibility Matrix (reglas)

Reglas tipo “SI… ENTONCES…” para evitar:

- combinaciones inverosímiles (rol/spawn)
- sopa de twists (twist grande + antagonista extremo + pace rápido)
- rutas muertas (sin endings viables)
- leverage sin location posible

---

## 10) Representación serializable + Playground (decisión asentada)

La cápsula debe poder expresarse como:

- **documento humano** (Markdown en Foundation)
- **paquete serializable** (JSON/YAML equivalente)

Objetivo futuro:

- un **engine** que cargue cápsulas desde esos paquetes
- un **Playground** para ejecutar runs, cambiar diales, y ver:
  - beat progression
  - hotspots activos
  - endings alcanzables
  - logs de outcomes

Regla: el paquete serializable debe pasar validación estricta contra el schema.

---

## 11) Checklist de “cápsula válida” (MVP)

- 3 escenas definidas (A/B/C)
- 2 IU con 2–4 approaches cada una
- 4 endings con conditions claras
- ≥ 3 locations
- hotspots por beat (affordances)
- al menos 2 rutas diferentes hacia 2 endings
- presets (2+) para demo/QA
- compat matrix con 10+ reglas mínimas
