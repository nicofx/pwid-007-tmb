# Compatibility Matrix v1 (Reglas para evitar combinaciones absurdas)

## Objetivo

Evitar:

- combinaciones inverosímiles (rol/spawn)
- rutas muertas (sin endings plausibles)
- “sopa” de twists
- leverage sin ubicación o sin ruta

Formato:

- reglas tipo **SI … ENTONCES …**
- agrupadas por categoría
- pocas pero fuertes (10–20 por cápsula)

---

## 1) Reglas generales (motor)

G1) **Role ↔ Spawn**
Cada rol debe declarar spawns válidos. Si no, la combinación es inválida.

G2) **Pace ↔ IU**
Si `pace=RÁPIDO`, ninguna IU puede requerir 3+ pasos largos.
Si `pace=LENTO`, debe haber presión narrativa (no “paseo gratis”).

G3) **Leverage Type ↔ Location**
Todo leverage type seleccionado debe tener al menos 1 leverage location válida.
Si no, la combinación es inválida.

G4) **No dead ends**
Toda combinación válida debe permitir:

- al menos 2 endings plausibles
- al menos 1 palanca alcanzable

G5) **Twist limit**
Si `trigger` es “twist grande”, no permitir simultáneamente:

- antagonista extremo **y**
- pace RÁPIDO
  (anti-sopa)

G6) **Action affordances**
Cada beat debe exponer hotspots/verbs coherentes con Role/Spawn.
Si un role queda sin affordances, la variante es inválida.

G7) **Cost fairness**
Si un cost variant es inevitable, debe existir al menos una acción de mitigación
(o se convierte en “castigo injusto” y se descarta).

---

## 2) Plantilla para reglas por cápsula (recomendado)

- ROL ↔ SPAWN (3–6 reglas)
- TRIGGER ↔ WITNESS (2–4)
- ANTAGONIST ↔ APPROACHES (2–4)
- LEVERAGE ↔ LOCATION (3–6)
- PACE ↔ ENDINGS (2–4)
- COST ↔ ENDING (1–3)
- QA rules (3–5)

---

## 3) Ejemplo (cápsula piloto Berlín 1933)

> _Ejemplo para mostrar cómo se escribe; la cápsula completa vive en su archivo de cápsula._

R1) Si `role=PORTERO` → spawn válido: {PORTERÍA, ESCALERA}.  
R2) Si `role=VISITANTE` → spawn válido: {ESCALERA, PASILLO}.  
R3) Si `trigger=DENUNCIA_VECINAL` → witness preferente: {VECINO_ALINEADO, VIEJO_ORGULLOSO}.  
R4) Si `antagonist=WEBER_CORRUPTIBLE` → `pace` no puede ser RÁPIDO (necesita ventana).  
R5) Si `leverage=PRUEBA` → location válida incluye {BUZONES, REGISTRO, BOLSILLO, TESTIGO}.  
R6) Si `pace=RÁPIDO` → “Rescate” solo por DISTRACCIÓN+ACCESO, no por procedimiento.

---

## 4) QA Rules (recomendadas)

Q1) Cada preset debe habilitar al menos 2 endings posibles.
Q2) El set de presets debe cubrir los 4 leverage types.
Q3) Ningún preset depende de una frase exacta del jugador.
Q4) Toda cápsula debe incluir al menos 1 ruta “acción pura” (no solo TALK).
