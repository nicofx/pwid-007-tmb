# Variability Spec v1 (Runs únicas con control)

## Objetivo

Garantizar que:

- cada run de una cápsula sea distinta
- la variabilidad sea **controlada** (no “sopa random”)
- sea testeable (presets)
- sea compatible con el motor (beats/IU/hotspots/endings)

La variabilidad se define por **diales** + **presupuesto** + **guardrails**.

---

## 1) Definiciones

- **Run:** una ejecución completa de una cápsula.
- **Dial:** parámetro discreto de variabilidad (role/spawn/trigger/etc.).
- **Variant Set:** valores de diales seleccionados para una run.
- **Budget:** límite de diales que se pueden mover por run.
- **Preset:** Variant Set curado para demo/QA.

---

## 2) Diales estándar (D1–D10)

Estos diales existen a nivel motor. Cada cápsula puede:

- usar un subset
- definir valores permitidos
- definir compatibilidad

### D1 Role (estructural)

Define posición social/acceso/riesgo inicial.

### D2 Spawn / Entry Point (estructural)

Dónde y cómo arranca el jugador (primer minuto).

### D3 Trigger Variant (medio)

Qué exactamente detona el conflicto (denuncia, lista, derrame, rumor, etc.).

### D4 Key Witness / Ally Archetype (medio)

Quién cumple el rol de “puente humano” (testigo/aliado) y qué estilos responden.

### D5 Antagonist Profile (medio)

Quién representa el obstáculo (autoridad, intruso, rival, caos, etc.).

### D6 Leverage Type (medio)

Tipo de palanca dominante:

- PRUEBA / ACCESO / ALIADO / DISTRACCIÓN

### D7 Leverage Location (medio)

Dónde está la palanca (buzones, cuaderno, café, etc.).

### D8 Pace / Clock (medio)

Ritmo: RÁPIDO / MEDIO / LENTO (ventanas de oportunidad).

### D9 Profile Bias (suave)

Sesgo por tags previos del jugador: sugiere rutas y reacciona socialmente.

### D10 Cost Variant (suave)

Costo final alternativo (anonimato/deuda/aliado/herida/etc.).

---

## 3) Presupuesto de variabilidad (Budget v1)

Para mantener coherencia y control:

- **Estructurales:** máx 2 (Role + Spawn)
- **Medios:** máx 3 (entre D3–D8)
- **Suaves:** máx 2 (D9–D10)
- **Total:** máx 7 diales modificados por run (ideal 5–6)

Regla: una run no debe mover “todo” a la vez.

---

## 4) Selección de diales (cómo se elige)

Modos:

### 4.1 Curated Intro

Las primeras 1–2 runs del usuario se resuelven con presets probados.

### 4.2 Guided Random

Selección aleatoria acotada por:

- budget
- compatibilidad
- anti-repetición
- perfil del jugador (bias)
- objetivo de intensidad (normal/alta)

### 4.3 User Pick

El usuario elige 1–2 diales (ej: role, tono), el resto Guided Random.

### 4.4 Surprise Me

El sistema elige todo dentro de guardrails.

---

## 5) Guardrails de coherencia

### 5.1 Truths (inamovibles)

La variabilidad no puede violar Truths de la cápsula.

### 5.2 Compatibilidad

Se define una matriz de compatibilidad (ver 08_compatibility_matrix.md).

### 5.3 Anti-sopa

- Máximo 1 “twist grande” por run.
- Si `pace=RÁPIDO`, reducir cambios de NPCs y rutas largas.
- Si se repite el mismo ending 2 veces seguidas, bajar probabilidad de repetirlo.

---

## 6) Uniqueness Rules (garantía de no repetición)

Reglas mínimas por cápsula:

1. En runs consecutivas, cambiar al menos:
   - 1 dial estructural, **o**
   - 2 diales medios

2. No repetir el mismo `leverage_type` más de 2 veces seguidas.

3. No repetir el mismo `witness` en runs consecutivas, salvo elección explícita del jugador.

4. Alternar `pace`: si la última fue RÁPIDO, tender a MEDIO/LENTO.

---

## 7) Presets (demo/QA)

Cada cápsula define 2–4 presets:

- cubren distintos estilos de juego
- garantizan al menos 2 endings plausibles
- ayudan a testear todos los leverage types

---

## 8) Instrumentación mínima para calibrar

Registrar por run:

- Variant Set completo (D1–D10 usados)
- ending alcanzado
- turnos por escena
- outcomes de IU
- histograma de verbs/intents
- abandono por beat

Objetivo: calibrar sin fe, con datos.
