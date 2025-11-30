# Wellness Link — PRD Funcional

> Plataforma de tarjetas digitales para asesores de bienestar

---

## 1. Visión del Producto

### ¿Qué es?

Wellness Link es una plataforma web que permite a asesores de bienestar crear su tarjeta digital profesional con funcionalidades especializadas para captar y atender clientes.

### ¿Para quién?

Asesores de bienestar, nutricionistas, coaches de salud, y profesionales del wellness que necesitan una presencia digital profesional y herramientas para interactuar con potenciales clientes.

### Problema que resuelve

Los asesores de bienestar actualmente:
- Usan tarjetas físicas que se pierden o dañan
- No tienen forma fácil de captar leads calificados
- Dependen de múltiples herramientas desconectadas
- Pierden oportunidades por no tener presencia digital profesional

### Solución

Una tarjeta digital con:
- Perfil profesional siempre accesible
- Features especializadas (encuestas de salud, agenda, etc.)
- Resultados enviados directo a WhatsApp
- QR para compartir en persona

### Diferenciadores vs Linktree

| Linktree | Wellness Link |
|----------|---------------|
| Links genéricos | Features especializadas para bienestar |
| Sin interacción | Resultados enviados por WhatsApp |
| Cualquier nicho | 100% enfocado en asesores de bienestar |
| Solo links | QR + Card virtual imprimible |

---

## 2. Módulos del Sistema

### 2.1 🔐 Autenticación y Onboarding

Registro e inicio de sesión de asesores.

**Funcionalidades:**
- Registro con email o Google
- Verificación de cuenta
- Onboarding guiado (3-4 pasos para completar perfil inicial)
- Recuperación de contraseña

---

### 2.2 👤 Perfil Público (Bio Link)

La tarjeta digital que ven los visitantes.

**Elementos del perfil:**
- Foto de perfil
- Nombre y título profesional
- Bio corta (máx 160 caracteres)
- Links a redes sociales (WhatsApp, Instagram, TikTok, Facebook, YouTube)
- Botones de acción (features activas, ej: "Evalúate gratis")

**Barra de acciones (floating):**
- 🔗 Compartir link (abre sheet nativo del dispositivo)
- 📱 Mostrar QR (modal con código QR escaneable)

**URL pública:** `wellnesslink.com/{username}`

**Flujo del QR:**
```
Asesor abre su perfil → Toca "Mostrar QR" → 
Aparece modal con QR grande → Visitante escanea → 
Se abre el perfil en el dispositivo del visitante
```

---

### 2.3 🎨 Temas (Post-MVP)

Personalización del diseño de la tarjeta.

**MVP:** Diseño único predeterminado para todos los usuarios.

**Futuro:**
- Temas prediseñados (5-10 opciones)
- Selección con preview en vivo
- Posible: colores y fuentes personalizadas (v2+)

---

### 2.4 🧩 Features

Sistema modular de funcionalidades que el asesor puede activar en su perfil.

**Comportamiento:**
- Cada feature se activa/desactiva con un toggle desde el dashboard
- Al activar, aparece como botón en el perfil público
- Texto del botón personalizable por feature

> Ver sección 3 para el listado completo de features.

---

### 2.5 📱 QR y Card Virtual

Herramientas para compartir offline (desde Dashboard).

**Funcionalidades:**
- Descargar QR en PNG/SVG (para imprimir)
- Card virtual descargable (imagen tipo tarjeta de presentación)
- Preview antes de descargar

**Nota:** El QR también se puede mostrar en vivo desde el perfil público (ver módulo 2.2).

---

### 2.6 📊 Dashboard

Panel principal del asesor.

**Métricas visibles:**
- Visitas al perfil (hoy, semana, mes)
- Encuestas completadas
- Clicks en redes sociales
- Fuentes de tráfico (QR vs link directo)

**Acciones rápidas:**
- Ver mi perfil público
- Copiar mi link
- Descargar QR
- Editar perfil

---

### 2.7 ⚙️ Configuración

Ajustes de la cuenta.

**Opciones:**
- Cambiar username
- Actualizar email/contraseña
- Número de WhatsApp para recibir encuestas
- Notificaciones (email cuando alguien completa encuesta)
- Eliminar cuenta

---

## 3. Sistema de Features

El sistema de features permite agregar funcionalidades modulares al perfil del asesor. Cada feature:

- Se activa/desactiva desde el dashboard
- Aparece como botón en el perfil público cuando está activa
- Tiene configuración propia (texto del botón, opciones específicas)

### Features MVP

| # | Feature | Descripción | Texto default | Documentación |
|---|---------|-------------|---------------|---------------|
| 1 | Encuesta de Salud | Test de Transformación 7 días → envía resultados por WhatsApp | "Evalúate gratis" | [feature-1-evaluation.md](./feature-1-evaluation.md) |

### Features Futuras

| # | Feature | Descripción | Prioridad |
|---|---------|-------------|-----------|
| 2 | Agenda de citas | Permitir agendar consultas con el asesor | 🟡 Media |
| 3 | Testimonios | Mostrar reseñas de clientes satisfechos | 🟢 Baja |

---

## 4. Resumen Visual de Módulos

```
┌─────────────────────────────────────────────────┐
│                 WELLNESS LINK                   │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │   Auth   │  │ Dashboard│  │  Config  │      │
│  │   2.1    │  │   2.6    │  │   2.7    │      │
│  └──────────┘  └──────────┘  └──────────┘      │
│                                                 │
│  ┌──────────────────────────────────────┐      │
│  │       Perfil Público (2.2)           │      │
│  │  ┌─────────┐ ┌────────┐              │      │
│  │  │Features │ │QR/Card │  ┌────────┐  │      │
│  │  │  (2.4)  │ │ (2.5)  │  │ Temas  │  │      │
│  │  └─────────┘ └────────┘  │ (2.3)  │  │      │
│  │                          │(futuro)│  │      │
│  │                          └────────┘  │      │
│  └──────────────────────────────────────┘      │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## 5. Prioridades MVP

| Módulo | Prioridad | Notas |
|--------|-----------|-------|
| Autenticación (2.1) | 🔴 Alta | Sin esto no hay producto |
| Perfil Público (2.2) | 🔴 Alta | Core del producto |
| Features (2.4) | 🔴 Alta | Diferenciador clave (inicia con encuesta) |
| QR/Card (2.5) | 🟡 Media | Genera valor offline |
| Dashboard (2.6) | 🟡 Media | Métricas básicas |
| Configuración (2.7) | 🟢 Baja | Solo lo esencial |
| Temas (2.3) | ⚪ Post-MVP | Diseño único en MVP |

---

## 6. Flujos Principales

### 6.1 Flujo de Registro (Asesor)

```
Landing page
    ↓
Click "Crear cuenta"
    ↓
Registro (email/Google)
    ↓
Verificación de email
    ↓
Onboarding:
  → Paso 1: Nombre y username
  → Paso 2: Foto de perfil
  → Paso 3: Bio y título
  → Paso 4: Redes sociales
  → Paso 5: Número WhatsApp
    ↓
Dashboard (perfil listo)
```

### 6.2 Flujo del Visitante

```
Escanea QR o recibe link
    ↓
Ve perfil público del asesor
    ↓
Opciones:
  → Ver redes sociales
  → Contactar por WhatsApp
  → Completar encuesta ("Evalúate gratis")
    ↓
Si completa encuesta → Resultados enviados al asesor por WhatsApp
```

### 6.3 Flujo de Compartir (Asesor)

```
Asesor en persona con potencial cliente
    ↓
Abre su perfil en el celular
    ↓
Toca "Mostrar QR"
    ↓
Modal con QR grande
    ↓
Cliente escanea con su celular
    ↓
Se abre el perfil en el dispositivo del cliente
    ↓
Cliente puede completar encuesta o seguir redes
```

---

## 7. Próximos Pasos

1. ✅ Definir PRD global
2. ✅ Documentar Feature 1 (Encuesta de Salud)
3. ⏳ Crear historias de usuario por módulo
4. ⏳ Diseñar wireframes/mockups
5. ⏳ Definir stack técnico
6. ⏳ Implementar MVP
