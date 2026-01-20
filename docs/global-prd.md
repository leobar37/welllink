# MediApp — CRM para Médicos

> Plataforma de gestión integral para profesionales de la salud

---

## 1. Visión del Producto

### ¿Qué es?

MediApp es una plataforma web CRM diseñada específicamente para médicos y profesionales de la salud que combina:

- **Página de presentación profesional** con servicios, galería y información
- **Agente de IA** para atención 24/7 vía WhatsApp y web
- **Sistema de agendamiento de citas** con approval workflow
- **Gestión de pacientes** con notas y historial

### ¿Para quién?

Médicos generales, especialistas, dentistas, y profesionales de la salud que:

- Necesitan una presencia digital profesional
- Quieren automatizar la atención al paciente
- Requieren gestionar su agenda y pacientes de forma eficiente
- Desean un agente virtual que responda preguntas frecuentes

### Problema que resuelve

Los médicos actualmente:

- Pierden tiempo respondiendo las mismas preguntas repetitivas
- No tienen sistema de citas centralizado
- Dependen de múltiples herramientas desconectadas
- No pueden atender pacientes fuera de horario
- Pierden seguimiento de pacientes existentes

### Solución

Una plataforma todo-en-uno con:

- Página pública profesional siempre accesible
- Agente IA que responde 24/7
- Citas con confirmación automática
- CRM para gestión de pacientes
- Notificaciones por WhatsApp

---

## 2. Módulos del Sistema

### 2.1 🔐 Autenticación y Onboarding

Registro e inicio de sesión de médicos.

**Funcionalidades:**

- Registro con email o Google
- Verificación de cuenta
- Onboarding guiado (datos profesionales, especialidad, servicios iniciales)
- Recuperación de contraseña

---

### 2.2 👤 Página de Presentación Pública

La página web profesional que ven los pacientes.

**Elementos:**

- Foto de perfil profesional
- Nombre y título/m特殊idad
- Bio corta y credentials médicos
- Lista de servicios con precios
- Galería de fotos (consultorio, equipo, procedimientos)
- Reseñas/Testimonios
- Botones de acción (WhatsApp, Agendar Cita)

**Barra de acciones (floating):**

- 🔗 Compartir link
- 📱 Mostrar QR

**URL pública:** `mediapp.app/{username}`

---

### 2.3 🏥 Servicios Médicos

Gestión de servicios y procedimientos.

**Funcionalidades:**

- Crear/editar/eliminar servicios
- Nombre, descripción, precio, duración
- Categorías (consulta, procedimiento, paquete)
- Estado (activo/inactivo)

---

### 2.4 📸 Galería de Fotos

Imágenes del consultorio y práctica médica.

**Funcionalidades:**

- Subir fotos del consultorio
- Fotos del equipo médico
- Imágenes de procedimientos (antes/después)
- Gestión de albums
- Foto principal (avatar del médico)

---

### 2.5 💬 Agente IA

Asistente virtual para atención 24/7.

**Canales:**

- WhatsApp (Evolution API)
- Web (chat en vivo en página pública)

**Capacidades:**

- Responder preguntas frecuentes
- Proporcionar información sobre servicios y precios
- Agendar citas via chat
- Enviar recordatorios automáticos
- Derivar al médico cuando sea necesario

**Configuración:**

- FAQ personalizada
- Tono de respuesta
- Información del consultorio
- Palabras clave a evitar

---

### 2.6 📅 Sistema de Citas

Agendamiento con approval workflow.

**Flujo:**

1. Paciente selecciona servicio y horario
2. Envía solicitud
3. Médico aprueba/rechaza/modifica
4. Paciente recibe confirmación por WhatsApp
5. Recordatorios automáticos (24h, 2h)

**Características:**

- Slots configurables con capacidad
- Reglas de disponibilidad
- Nivel de urgencia
- Notificaciones automáticas

---

### 2.7 👥 Gestión de Pacientes (CRM)

Base de datos de pacientes con notas y seguimiento.

**Datos del paciente:**

- Nombre, teléfono, email, fecha de nacimiento
- Labels: Nuevo/Recurrente/VIP/Potencial/Inactivo
- Notas médicas y preferencias
- Historial de citas

**Automatizaciones:**

- Recordatorios post-consulta
- Cumpleaños
- Reactivación de pacientes inactivos

---

### 2.8 📊 Dashboard

Panel principal del médico.

**Métricas:**

- Pacientes nuevos (semana/mes)
- Citas agendadas
- Tasa de respuesta del Agente IA
- Pacientes inactivos
- Ingresos estimados

**Acciones rápidas:**

- Ver página pública
- Agendar nueva cita
- Ver pacientes
- Configurar Agente IA

---

### 2.9 ⚙️ Configuración

Ajustes de la cuenta y práctica.

**Opciones:**

- Datos del perfil profesional
- Configuración de WhatsApp Business
- Configuración del Agente IA
- Preferencias de notificaciones
- Horarios de atención
- Eliminar cuenta

---

## 3. Sistema de Features

El sistema de features permite agregar funcionalidades modulares al perfil público.

### Features Principales

| #   | Feature           | Descripción                     | Texto default     |
| --- | ----------------- | ------------------------------- | ----------------- |
| 1   | Encuesta de Salud | Evaluación inicial del paciente | "Evalúate gratis" |
| 2   | Agente IA         | Asistente virtual 24/7          | "Pregúntame"      |
| 3   | Agendar Cita      | Sistema de reservas             | "Agendar Cita"    |
| 4   | WhatsApp          | Contacto directo                | "Escríbeme"       |

### Features Opcionales

| #   | Feature     | Descripción           |
| --- | ----------- | --------------------- |
| 5   | Galería     | Fotos del consultorio |
| 6   | Testimonios | Reseñas de pacientes  |
| 7   | Servicios   | Lista de servicios    |

---

## 4. Resumen Visual de Módulos

```
┌─────────────────────────────────────────────────────────────┐
│                    WELLNESS LINK                            │
│                    CRM para Médicos                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │Dashboard │  │ Config   │  │ WhatsApp │   │
│  │   2.1    │  │   2.8    │  │   2.9    │  │   2.9    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Página Pública (2.2)                    │   │
│  │  ┌─────────┐ ┌────────┐ ┌─────────┐ ┌─────────┐    │   │
│  │  │Servicios│ │ Galeria│ │Testimonios│ │Features │    │   │
│  │  │  (2.3)  │ │ (2.4)  │ │  (2.7)   │ │ (2.4)  │    │   │
│  │  └─────────┘ └────────┘ └─────────┘ └─────────┘    │   │
│  │       │                    │               │        │   │
│  │       └────── Agente IA ───┴────── Citas ──┘        │   │
│  │       (2.5)              (2.6)        │             │   │
│  │                               │       │             │   │
│  │                               └───────┴────────┐    │   │
│  │                                           CRM  │    │   │
│  │                                          (2.7) │    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                 Backend Services                     │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────────────┐   │   │
│  │  │WhatsApp │ │ Agente  │ │ Citas + CRM         │   │   │
│  │  │   API   │ │   IA    │ │ (M10, M11)          │   │   │
│  │  └─────────┘ └─────────┘ └─────────────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. Prioridades MVP

| Módulo               | Prioridad   | Notas               |
| -------------------- | ----------- | ------------------- |
| Autenticación (2.1)  | 🔴 Alta     | Base del sistema    |
| Página Pública (2.2) | 🔴 Alta     | Presencia digital   |
| Servicios (2.3)      | 🔴 Alta     | Core de la oferta   |
| Agente IA (2.5)      | 🔴 Alta     | Diferenciador clave |
| Citas (2.6)          | 🔴 Alta     | Revenue driver      |
| CRM Pacientes (2.7)  | 🟡 Media    | Gestión de base     |
| Dashboard (2.8)      | 🟡 Media    | Métricas y acciones |
| Configuración (2.9)  | 🟡 Media    | Personalización     |
| Galería (2.4)        | 🟢 Baja     | Complementario      |
| Testimonios          | ⚪ Post-MVP | Social proof        |

---

## 6. Flujos Principales

### 6.1 Flujo de Registro (Médico)

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
  → Paso 1: Datos profesionales (nombre, especialidad, Cédula)
  → Paso 2: Foto de perfil
  → Paso 3: Servicios iniciales
  → Paso 4: Configuración básica
    ↓
Dashboard (perfil listo)
```

### 6.2 Flujo del Paciente (Agente IA)

```
Paciente envía WhatsApp o visita página web
    ↓
Agente IA responde automáticamente
    ↓
Opciones:
  → Preguntar sobre servicios/precios → IA responde
  → Agendar cita → IA verifica disponibilidad → Confirma
  → Hablar con médico → Notificación al médico
    ↓
Si agenda → Confirmación por WhatsApp → Recordatorios automáticos
```

### 6.3 Flujo de Cita

```
Paciente selecciona servicio en página
    ↓
Selecciona horario disponible
    ↓
Ingresa datos de contacto
    ↓
Envía solicitud
    ↓
Médico recibe notificación
    ↓
Aprueba/Rechaza/Modifica
    ↓
Paciente recibe confirmación por WhatsApp
    ↓
Recordatorios automáticos (24h, 2h)
    ↓
Cita completada → Paciente agregado al CRM
```

---

## 7. Diferenciadores

| Herramienta Genérica | MediApp                       |
| -------------------- | ----------------------------- |
| Sin IA               | Agente IA 24/7                |
| Citas manuales       | Agendamiento automatizado     |
| Sin CRM              | Gestión completa de pacientes |
| Solo web             | WhatsApp + Web                |
| Genérico             | 100% enfocado en médicos      |

---

## 8. Métricas de Éxito

- **Tasa de Respuesta IA**: % de consultas resueltas por IA
- **Citas Agendadas via IA**: Conversión chat → cita
- **Pacientes Nuevos**: Registros por mes
- **Tasa de Retención**: Pacientes que regresan
- **No-Show Rate**: Citas perdidas vs confirmadas

---

## 9. Próximos Pasos

1. ⏳ Documentar módulos detallados (M10, M11, etc.)
2. ⏳ Crear historias de usuario por módulo
3. ⏳ Diseñar wireframes/mockups
4. ⏳ Implementar MVP por fases
