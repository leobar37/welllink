# Feature: Encuesta de Salud

> Proceso de Transformación 7 Días

---

## Descripción

Encuesta interactiva que permite a los visitantes evaluar su estado de salud. Los resultados se envían automáticamente por WhatsApp al asesor de bienestar.

**Texto del botón en perfil:** "Evalúate gratis" (personalizable)

---

## Flujo del Usuario

```
Visitante ve perfil del asesor
    ↓
Toca botón "Evalúate gratis"
    ↓
Intro de la encuesta
    ↓
Paso 1: Datos personales
    ↓
Paso 2: Medidas (peso, estatura, edad)
    ↓
Paso 3-10: Condiciones de salud (8 categorías)
    ↓
Paso 11: Hábitos
    ↓
Resumen de respuestas
    ↓
Enviar por WhatsApp al asesor
```

---

## Datos Capturados

### Datos personales

| Campo | Tipo | Requerido |
|-------|------|-----------|
| Nombre completo | texto | ✅ |
| Teléfono | tel | ❌ |
| Email o redes | texto | ❌ |
| ¿Quién te invitó? | texto | ❌ |

### Medidas

| Campo | Tipo | Unidad |
|-------|------|--------|
| Peso | número | kg |
| Estatura | número | cm |
| Edad | número | años |

### Condiciones de Salud

Se presentan por categorías, una a la vez, para mejor UX móvil.

#### Digestivo 🫃
- Reflujo gástrico
- Gastritis
- Estreñimiento/diarrea
- Inflamación del colon
- Hinchazón estomacal
- Gases
- Hemorroides
- Hernia hiatal
- Hígado graso

#### Cardiovascular ❤️
- Presión alta
- Colesterol alto
- Triglicéridos
- Mala circulación
- Problemas del corazón
- Anemia

#### Energía y Sueño ⚡
- Problemas para dormir
- Falta de energía
- Mareos
- Calambres
- Hipoglicemia

#### Sistema Inmune 🛡️
- Gripas frecuentes
- Defensas bajas
- Alergias
- Asma
- Rinitis o sinusitis

#### Muscular y Óseo 🦴
- Dolor de articulaciones
- Dolor de espalda
- Osteoporosis
- Fibromialgia

#### Hormonal / Reproductivo 🌙
- Cólicos menstruales
- Periodos irregulares
- Ovarios poliquísticos
- Diabetes

#### Piel y Estética ✨
- Problemas de piel
- Caída del cabello
- Uñas débiles
- Celulitis

#### Otros 🩺
- Dolores de cabeza
- Ansiedad
- Visión borrosa
- Mal aliento
- Infección urinaria
- Orina oscura/fuerte
- Retención de líquidos
- Consumo de medicamentos

### Hábitos

| Pregunta | Tipo de respuesta |
|----------|-------------------|
| ¿Cuánta agua tomas al día? | texto libre |
| ¿Estás entrenando? | Sí / No / A veces |
| ¿Te alimentas bien? | Sí / No / Regular |
| Historial familiar de salud | texto libre (opcional) |

---

## Output: Mensaje WhatsApp

```
🌿 *PROCESO DE TRANSFORMACIÓN 7 DÍAS*

👤 *Datos Personales*
Nombre: {nombre}
Teléfono: {teléfono}
Email: {email}
Invitado por: {referido}

📊 *Medidas*
Peso: {peso} kg
Estatura: {estatura} cm
Edad: {edad} años

🩺 *Condiciones de Salud ({total})*
• {condición 1}
• {condición 2}
• ...

🏃 *Hábitos*
Agua diaria: {agua}
Entrena: {entrena}
Alimentación: {alimentación}

👨‍👩‍👧 *Historial Familiar*
{historial}
```

---

## Configuración del Asesor

Desde el dashboard, el asesor puede:

| Opción | Descripción |
|--------|-------------|
| Activar/Desactivar | Toggle para mostrar u ocultar en su perfil |
| Texto del botón | Personalizar (default: "Evalúate gratis") |
| WhatsApp destino | Número donde recibe los resultados |

---

## Consideraciones UX

- **Mobile-first**: Diseñado para completarse desde el celular
- **Progreso visible**: Barra de progreso en cada paso
- **Categorías separadas**: No abrumar con 45+ checkboxes de golpe
- **Opción de saltar**: Puede omitir categorías de condiciones
- **Feedback táctil**: Animaciones al seleccionar opciones
- **Resumen antes de enviar**: El usuario revisa todo antes de enviar
