# Module 10 — CRM Médico con Agente IA

## Visión General

Este módulo transforma MediApp en un **CRM inteligente para profesionales de la salud** que combina gestión de pacientes, agente de IA para atención 24/7, y automatización de comunicación vía WhatsApp y web.

## Objetivos del Módulo

### Objetivo Principal

Empoderar a médicos y profesionales de la salud con un asistente de IA que:

- Atiende pacientes las 24/7 vía WhatsApp y web
- Gestiona la base de pacientes de forma inteligente
- Automatiza recordatorios y seguimientos
- Mejora la comunicación médico-paciente

### Objetivos Secundarios

- **Disponibilidad 24/7**: Agente IA responde cuando el médico no está disponible
- **Personalización**: Comunicación específica por tipo de paciente (nuevo, recurrente, VIP)
- **Eficiencia**: Automatizar recordatorios de citas y seguimientos post-consulta
- **Inteligencia**: IA que aprende del historial del médico para mejorar respuestas

## Alcance MVP

### Fase 1 - CRM Básico + Agente IA ✅

- [x] Gestión básica de pacientes
- [x] Sistema de etiquetas por tipo de paciente
- [x] Notas por paciente
- [x] Integración WhatsApp (Evolution API)

### Fase 2 - Agente IA + Automatización (Implementación Actual)

- [ ] **Agente de IA para WhatsApp**
  - Respuestas automáticas a preguntas frecuentes
  - Información sobre servicios y precios
  - Agendamiento de citas via chat
  - Confirmación y recordatorios automáticos

- [ ] **Agente de IA para Web**
  - Chat en vivo en la página pública
  - FAQs dinámicas basadas en servicios del médico
    -links a agendamiento

- [ ] **Sistema de Pacientes Completo**
  - Registro con datos médicos básicos
  - Historial de consultas
  - Sistema de notas clínicas
  - Labels por tipo: Nuevo/Recurrente/VIP/Potencial

- [ ] **Automatizaciones**
  - Recordatorios de cita (24h, 2h antes)
  - Seguimiento post-consulta
  - Cumpleaños y fechas especiales
  - Campañas de salud preventiva

### Fase 3 - Pro (Futuro)

- [ ] Integración con sistemas externos (historial clínico)
- [ ] Teleconsulta integrada
- [ ] Recetas y órdenes digitales
- [ ] Analítica avanzada de pacientes

## Funcionalidades Principales

### 1. Agente de IA

#### Características

- **Respuestas Automáticas**:
  - Información sobre servicios y especialidades
  - Precios de consultas y procedimientos
  - Horarios de atención
  - Ubicación del consultorio
  - Preguntas frecuentes médicas generales

- **Agendamiento Inteligente**:
  - Verifica disponibilidad en tiempo real
  - Pre-confirma citas via chat
  - Envía confirmación automática
  - Maneja cancelaciones y reprogramaciones

- **Personalización por Médico**:
  - Configuración de FAQ personalizada
  - Tono de respuesta (formal/profesional/cercano)
  - Información específica del consultorio
  - Palabras clave a evitar (términos médicos sensibles)

#### Flujo del Agente IA

```
Paciente envía mensaje WhatsApp
            ↓
Agente IA procesa mensaje
            ↓
¿Puede responder?
    ├─ SÍ → Responde con información
    └─ NO → Notifica al médico
            ↓
¿Paciente quiere agendar?
    ├─ SÍ → Verifica slots → Confirma cita
    └─ NO → Cierra conversación cortés
```

### 2. Gestión de Pacientes

#### Registro de Pacientes

- **Formulario de Registro**:
  - Nombre completo (requerido)
  - Teléfono WhatsApp (requerido)
  - Email (opcional)
  - Fecha de nacimiento (para edad)
  - Label inicial (nuevo/recurrente/VIP/potencial)
  - Notas iniciales
  - Médico de origen (si viene de referencia)

- **Lista de Pacientes**:
  - Vista de tabla con todos los pacientes
  - Filtros por label, fecha de última consulta
  - Búsqueda por nombre o teléfono
  - Paginación
  - Acciones: ver, editar, eliminar, enviar mensaje

#### Sistema de Notas

- **Agregar Nota**:
  - Texto libre con timestamp
  - Visible solo para el médico/propietario

- **Ejemplos de Notas**:
  - "Prefiere citas en la mañana"
  - "Alérgico a anestesia local"
  - "Tiene diabetes tipo 2"
  - "Prefiere contacto por WhatsApp"
  - "Notable mejoría en última consulta"

- **Uso en IA**: Las notas personalizan las respuestas del agente

### 3. Labels por Paciente

| Label          | Descripción                        | Uso                     |
| -------------- | ---------------------------------- | ----------------------- |
| **Nuevo**      | Primera consulta o primer contacto | Seguimiento intensivo   |
| **Recurrente** | Paciente con múltiples consultas   | Mantenimiento regular   |
| **VIP**        | Paciente importante/fijo           | Atención preferencial   |
| **Potencial**  | Contacto que aún no ha consultado  | Conversión a nuevo      |
| **Inactivo**   | Sin consulta en X meses            | Campaña de reactivación |

### 4. Automatizaciones

#### Recordatorios Automáticos

| Tipo             | Timing                 | Contenido                            |
| ---------------- | ---------------------- | ------------------------------------ |
| Confirmación     | Inmediato tras agendar | Fecha, hora, dirección, preparación  |
| Recordatorio 24h | 24h antes              | Recordatorio + información relevante |
| Recordatorio 2h  | 2h antes               | recordatorio final + ubicación       |
| Seguimiento      | 48h post-consulta      | "¿Cómo se siente? ¿Tiene dudas?"     |
| Cumpleaños       | Día del cumpleaños     | Mensaje personalizado + descuento    |

#### Flujo de Automatización

```
Evento disparador (agendar/cumpleaños)
            ↓
Seleccionar plantilla correspondiente
            ↓
Personalizar con datos del paciente
            ↓
Enviar en el momento programado
            ↓
Registrar estado (enviado/entregado/fallido)
```

### 5. Integración Web

#### Chat en Vivo

- Widget en la página pública del médico
- Mismo Agente IA que WhatsApp
  -links directos a servicios y agendamiento
- Historial de conversación

#### Preguntas Frecuentes Dinámicas

- FAQ basada en servicios configurados
- Respuestas automáticas a consultas comunes
- links a información detallada

## Experiencia de Usuario (UX)

### Pantalla Principal CRM

```
┌─────────────────────────────────────────────────────────┐
│  🏥 CRM Médico con IA                                   │
├─────────────────────────────────────────────────────────┤
│  [📋 Pacientes] [💬 Agente IA] [📅 Citas] [📊 Reportes] │
│                                                         │
│  Resumen:                                               │
│  • 156 pacientes totales                                │
│  • 12 nuevas solicitudes esta semana                    │
│  • 89% tasa de respuesta del Agente IA                  │
│  • 3 citas pendientes de confirmación                  │
│                                                         │
│  Pacientes Recientes:                                   │
│  • María González - VIP - Última: hace 3 días          │
│  • Carlos Ruiz - Recurrente - Última: hace 1 semana    │
│  • Ana López - Nuevo - Primera consulta ayer            │
│                                                         │
│  [➕ Nuevo Paciente]  [📋 Ver Todos]                    │
└─────────────────────────────────────────────────────────┘
```

### Configuración del Agente IA

```
┌─────────────────────────────────────────────────────────┐
│  ⚙️ Configuración del Agente IA                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Información del Consultorio:                           │
│  • Nombre del médico: [Dr. Juan Pérez]                  │
│  • Especialidad: [Cardiología ▼]                        │
│  • Dirección: [Calle 123, Ciudad]                       │
│  • Teléfono: [+52 55 1234 5678]                         │
│  • Horario: [L-V 9:00-18:00, S 9:00-13:00]             │
│                                                         │
│  Tono de Respuesta:                                     │
│  ○ Formal          ○ Profesional    ● Cercano           │
│  ○ Amigable        ○ Directo                            │
│                                                         │
│  FAQ Personalizada:                                      │
│  [➕ Agregar pregunta frecuente]                        │
│  • "¿Cuánto cuesta una consulta?" → "La consulta es $X" │
│  • "¿Qué documentos llevar?" → "Llevar:..."             │
│  • "¿Aceptan seguros?" → "Aceptamos:..."                │
│                                                         │
│  [💾 Guardar Configuración]                             │
└─────────────────────────────────────────────────────────┘
```

## Arquitectura Técnica

### Dependencias

- **Module 01 (Auth)**: Autenticación de usuarios médicos
- **Module 09 (WhatsApp)**: Infraestructura base de WhatsApp
- **Module 11 (Reservations)**: Sistema de citas
- **Module 06 (Dashboard)**: Interfaz de gestión

### Stack Tecnológico

- **Backend**: Bun + Elysia + Drizzle ORM
- **Base de Datos**: PostgreSQL
- **IA**: OpenAI GPT-4 / DeepSeek
- **WhatsApp**: Evolution API
- **Web**: Webhooks para chat en vivo

### Integraciones

- **OpenAI/DeepSeek API**: Agente conversacional
- **Evolution API**: WhatsApp Business
- **PostgreSQL**: Base de datos

## Reglas de Negocio

### Privacidad y HIPAA

1. **Datos sensibles cifrados**: Historiales médicos encriptados
2. **Acceso controlado**: Solo el médico owner accede a sus pacientes
3. **Consentimiento**: Paciente debe aceptar términos de IA
4. **Audit log**: Registro de todos los accesos

### Limitaciones del Agente IA

1. **No da diagnósticos**: Deriva siempre al médico
2. **No prescribe**: Solo información general
3. **Urgencias**: Derige a servicios de emergencia
4. **Revisión humana**: Médico puede revisar conversaciones

### Comunicación Responsable

1. **Rate limiting**: Máx 100 mensajes/hora por paciente
2. **Opt-out**: Paciente puede desactivar notificaciones
3. **Horario**: Respetar horario de oficina para automensajes
4. **Contenido**: IA filtrada para evitar respuestas inadecuadas

## Métricas de Éxito

### KPIs Principales

1. **Tasa de Respuesta IA**: % de consultas resueltas por IA
2. **Citas Agendadas via IA**: Conversión chat → cita
3. **Pacientes Nuevos**: Registros por mes
4. **Tasa de Retención**: Pacientes que regresan
5. **Tasa de No-Show**: Citas perdidas vs confirmadas

### Dashboard de Métricas

```
┌─────────────────────────────────────────────────────────┐
│  📊 Métricas del CRM (Últimos 30 días)                  │
├─────────────────────────────────────────────────────────┤
│  📋 45 pacientes nuevos                                 │
│  💬 1,234 conversaciones IA                             │
│  ✅ 89% consultas resueltas por IA                      │
│  📅 78 citas agendadas via chat                         │
│  ⏱️ 2.3 min tiempo respuesta promedio                  │
│                                                         │
│  [Ver reporte completo]                                 │
└─────────────────────────────────────────────────────────┘
```

## Casos de Uso

### Caso 1: Consulta de Precio

**Paciente**: "¿Cuánto cuesta una consulta de cardiología?"
**Agente IA**: "La consulta de cardiología tiene un costo de $500 MXN.
Incluye revisión inicial y electrocardiograma. ¿Te gustaría agendar
una cita? Estos son nuestros horarios disponibles..."

### Caso 2: Agendamiento de Cita

**Paciente**: "Sí, quiero agendar para mañana en la mañana"
**Agente IA**: "Tengo los siguientes horarios disponibles mañana:

- 10:00 AM
- 11:30 AM
  ¿Cuál prefieres? También necesito tu nombre completo."

### Caso 3: Pregunta Médica

**Paciente**: "¿Es normal tener dolor de cabeza después de la vacuna?"
**Agente IA**: "El dolor de cabeza leve puede ser una reacción normal
a la vacuna. Sin embargo, si el dolor es intenso o viene acompañado
de fiebre alta, te recomiendo consultar. ¿Te gustaría agendar una
valoración?"

## FAQ

**P: ¿El Agente IA puede dar diagnósticos?**
R: No, el agente está configurado para no dar diagnósticos. Deriva siempre al médico para cualquier situación que lo requiera.

**P: ¿Puedo revisar las conversaciones del Agente IA?**
R: Sí, todas las conversaciones se registran y puedes revisarlas en cualquier momento.

**P: ¿Los pacientes pueden hablar con un humano?**
R: Sí, el paciente puede solicitar hablar con el médico en cualquier momento y recibirás una notificación.

**P: ¿Puedo personalizar las respuestas del Agente IA?**
R: Sí, puedes configurar FAQ, tono de respuesta e información específica de tu consultorio.

---

## Conclusión

El Módulo 10 transforma MediApp en un CRM médico completo que combina lo mejor de la automatización (Agente IA 24/7) con la atención personalizada que requieren los pacientes. Permite a los profesionales de la salud escalar su práctica sin perder la calidad en la comunicación.

---

## Database Schema

### patient (cliente renombrado para contexto médico)

| Field             | Type      | Description                             |
| ----------------- | --------- | --------------------------------------- |
| id                | uuid      | Primary key                             |
| profileId         | uuid      | Médico profile (FK)                     |
| healthSurveyId    | uuid      | Linked survey (FK, optional)            |
| name              | varchar   | Patient full name                       |
| phone             | varchar   | WhatsApp number                         |
| email             | varchar   | Email address (optional)                |
| birthDate         | date      | Date of birth                           |
| label             | enum      | nuevo/recurrente/vip/potencial/inactivo |
| medicalNotes      | text      | Clinical notes                          |
| preferences       | jsonb     | Patient preferences                     |
| lastVisitAt       | timestamp | Last visit date                         |
| nextAppointmentAt | timestamp | Scheduled appointment                   |
| createdAt         | timestamp | Creation date                           |
| updatedAt         | timestamp | Last update                             |

### patient-note

| Field     | Type      | Description              |
| --------- | --------- | ------------------------ |
| id        | uuid      | Primary key              |
| patientId | uuid      | Patient (FK)             |
| profileId | uuid      | Médico profile (FK)      |
| note      | text      | Note content             |
| type      | enum      | general/medical/followup |
| createdAt | timestamp | Creation date            |

### agent-conversation

| Field        | Type      | Description                |
| ------------ | --------- | -------------------------- |
| id           | uuid      | Primary key                |
| patientId    | uuid      | Patient (FK, optional)     |
| profileId    | uuid      | Médico profile (FK)        |
| channel      | enum      | whatsapp/web               |
| messageCount | integer   | Message count              |
| status       | enum      | active/completed/escalated |
| startedAt    | timestamp | Conversation start         |
| endedAt      | timestamp | Conversation end           |

### agent-message

| Field          | Type      | Description                 |
| -------------- | --------- | --------------------------- |
| id             | uuid      | Primary key                 |
| conversationId | uuid      | Conversation (FK)           |
| role           | enum      | user/assistant/system       |
| content        | text      | Message content             |
| metadata       | jsonb     | Extra data (intent, action) |
| createdAt      | timestamp | Creation date               |

### automation

| Field     | Type      | Description                         |
| --------- | --------- | ----------------------------------- |
| id        | uuid      | Primary key                         |
| profileId | uuid      | Médico profile (FK)                 |
| type      | enum      | reminder/followup/birthday/campaign |
| trigger   | enum      | appointment/date/manual             |
| template  | text      | Message template                    |
| timing    | interval  | When to send                        |
| isActive  | boolean   | Active status                       |
| createdAt | timestamp | Creation date                       |

---

## API Endpoints

### Patients API (`/api/patients`)

| Method | Endpoint                 | Description           |
| ------ | ------------------------ | --------------------- |
| GET    | `/`                      | List all patients     |
| GET    | `/:id`                   | Get single patient    |
| POST   | `/`                      | Create new patient    |
| PUT    | `/:id`                   | Update patient        |
| DELETE | `/:id`                   | Delete patient        |
| GET    | `/label/:label`          | Get patients by label |
| GET    | `/without-visit/:months` | Get inactive patients |
| GET    | `/:id/notes`             | Get patient notes     |
| POST   | `/:id/notes`             | Add note to patient   |

### Agent IA API (`/api/agent`)

| Method | Endpoint                      | Description               |
| ------ | ----------------------------- | ------------------------- |
| POST   | `/chat`                       | Send message to agent     |
| GET    | `/conversations`              | List conversations        |
| GET    | `/conversations/:id`          | Get conversation details  |
| GET    | `/conversations/:id/messages` | Get conversation messages |
| POST   | `/conversations/:id/end`      | End conversation          |
| POST   | `/escalate`                   | Escalate to human         |

### Automations API (`/api/automations`)

| Method | Endpoint    | Description       |
| ------ | ----------- | ----------------- |
| GET    | `/`         | List automations  |
| POST   | `/`         | Create automation |
| PUT    | `/:id`      | Update automation |
| DELETE | `/:id`      | Delete automation |
| POST   | `/:id/test` | Test automation   |
