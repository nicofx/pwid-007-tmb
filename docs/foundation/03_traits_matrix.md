# Matriz de Rasgos v1 (Perfil del jugador)

## Objetivo

Modelar cómo un jugador “tiende a actuar” frente a estímulos del mundo, de forma:

- **narrativa** (tags legibles y memorables)
- **medible** (basada en evidencia de acciones)
- **no gamey** (sin stats numéricos tipo RPG)
- **transferible** entre cápsulas (meta-progresión suave)

> El perfil no se declara (“hoy soy rebelde”); se infiere por conducta y costo aceptado.

---

## 1) Estímulos del mundo (Impulsos) — v1 (10)

Cada cápsula expone algunos de estos impulsos con mayor fuerza.

1. **Presión / amenaza**
2. **Autoridad / jerarquía**
3. **Corrupción / soborno**
4. **Injusticia / abuso**
5. **Tentación / beneficio personal**
6. **Miedo físico / peligro**
7. **Vergüenza / reputación pública**
8. **Lealtad / traición**
9. **Escasez / supervivencia**
10. **Verdad / curiosidad / conocimiento**

---

## 2) Ejes de respuesta (3 ejes)

Para cada impulso relevante, el jugador se caracteriza con 3 ejes simples.

### 2.1 Impacto (qué tanto te afecta)

- **BAJO** / **MEDIO** / **ALTO**

### 2.2 Estrategia dominante (cómo resolvés)

- **ENFRENTO**
- **ESQUIVO**
- **NEGOCIO**
- **MANIPULO**
- **ME SOMETO**
- **ME SACRIFICO**

### 2.3 Costo moral tolerado (hasta dónde llegás)

- **BAJO** / **MEDIO** / **ALTO**

> Estos ejes no se muestran como UI dura. Se usan para derivar tags narrativos.

---

## 3) Tags (rasgos narrativos)

Los tags son la “salida” visible del perfil. Deben ser:

- cortos
- legibles
- con “peso” humano

### 3.1 Reglas de otorgamiento (MVP)

- Una cápsula otorga **0–3 tags** (máximo) para no saturar.
- Un tag aparece cuando hay evidencia consistente **2 veces** (en la cápsula o acumulado).
- Un tag se **refuerza** al aparecer **3 veces**.
- Un tag puede **debilitarse** si el jugador actúa consistentemente en sentido contrario en 3 ocasiones (opcional v2).

### 3.2 Set inicial de tags v1 (12)

**Presión**

- `RESISTE_PRESION`
- `SE_QUIEBRA_PRESION`

**Autoridad**

- `DESAFIA_AUTORIDAD`
- `CEDE_AUTORIDAD`

**Corrupción**

- `APROVECHA_CORRUPCION`
- `RECHAZA_CORRUPCION`

**Injusticia**

- `NO_TOLERA_INJUSTICIA`
- `PRAGMATICO_ANTE_INJUSTICICIA`

**Verdad**

- `CURIOSO_POR_VERDAD`
- `EVITA_SABER_DE_MAS`

**Otros**

- `PROTEGE_A_OTROS`
- `PRIORIZA_SUPERVIVENCIA`

---

## 4) Evidencia: cómo se “gana” un tag (sin depender de frases exactas)

El motor registra evidencias discretas por turno/beat/IU:

### 4.1 Tipos de evidencia (genérico)

- **ACTION_STYLE**: tipo de jugada (ej: presionar/negociar/mentir/actuar en sombra)
- **RISK_ACCEPTED**: aceptaste un costo (sospecha sube, perder anonimato, herida, deuda)
- **MORAL_TRADEOFF**: elegiste salvar a alguien vs salvar una palanca
- **AUTHORITY_CONTACT**: interactuaste con autoridad y cómo
- **CORRUPTION_CONTACT**: ofreciste/aceptaste/rechazaste intercambio
- **TRUTH_SEEKING**: perseguí evidencia vs evité conocer

### 4.2 Ejemplos prácticos (mapeo)

- Repetís acciones de exposición pública + confrontación → evidencia hacia `DESAFIA_AUTORIDAD`
- Evitás intervenir y elegís salida segura cuando hay costo → evidencia hacia `PRIORIZA_SUPERVIVENCIA`
- Priorizás contener daño a costa de perder prueba → evidencia hacia `PROTEGE_A_OTROS` y `NO_TOLERA_INJUSTICIA`

---

## 5) Efectos funcionales de los tags (sin “power creep”)

Los tags afectan 4 cosas (todas en tono adulto, sin buffs numéricos visibles):

1. **Lectura social**: NPCs te interpretan distinto (“con vos se puede hablar” vs “vos sos peligroso”).
2. **Rutas de palanca**: algunos enfoques se vuelven más plausibles (no garantizados).
3. **Curaduría del Archivo**: qué cápsulas/tonos te sugiere para variedad + match.
4. **Finales etiquetados (bias)**: no te fuerza un final, pero inclina qué costos/legados aparecen como “naturales”.

> Importante: ningún tag debe convertir un estilo en “ruta ganadora”. El mundo responde con fricción contextual.

---

## 6) Anti-minmax (sin castigo injusto)

Para evitar “siempre hago X y gano”:

- Los tags NO dan inmunidad.
- El mundo tiene fricción: credibilidad, jerarquías, clock, sospecha.
- El motor puede aplicar **rendimiento decreciente** por repetir exactamente el mismo estilo en la misma cápsula (ver Imponderables/Director del mundo).

---

## 7) Persistencia del perfil

- El perfil vive en “memoria selectiva”: se guardan tags y 2–3 “cicatrices” narrativas relevantes.
- No se arrastran inventarios pesados ni stats.

---

## 8) Checklist de diseño por cápsula

Cada cápsula debe declarar:

- impulsos predominantes (2–4)
- qué tags es normal que “entrene”
- qué tags están bloqueados (no tiene sentido otorgarlos en ese contexto)
