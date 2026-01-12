# Module 11 — Sistema de Citas Médicas

## Visión General
Este módulo extiende el Módulo 02 (Perfil Público) y Módulo 04 (Features) para permitir a los médicos ofrecer servicios de agendamiento de citas. Los pacientes pueden solicitar citas a través de un formulario en el perfil público del médico, y los médicos pueden aprobar o rechazar solicitudes con notificaciones integradas por WhatsApp.

## Alcance MVP

- **Botón de Citas**: Visible en el perfil público cuando está activado el feature.
- **Formulario de Solicitud**: Pacientes envían solicitudes con datos personales e información médica.
- **Flujo de Aprobación**: El médico recibe notificaciones y puede aprobar/rechazar solicitudes.
- **Integración WhatsApp**: Notificaciones automáticas al paciente y al médico.
- **Widget en Dashboard**: Ver solicitudes pendientes y gestionar citas.

## Características Principales

- **Slots Inteligentes**: El médico configura horarios disponibles con límites de capacidad.
- **Gestión de Servicios**: Definir servicios (consulta, procedimiento, etc.) con precios y duración.
- **Expiración de Solicitudes**: Las solicitudes pendientes expiran después de 30 minutos.
- **Niveles de Urgencia**: Paciente indica urgencia (baja/normal/alta/urgente).
- **Gestión de Cambios**: El médico puede modificar hora o servicio al aprobar.
- **Sistema de Recordatorios**: Recordatorios automáticos 24h y 2h antes de la cita.

## Historias de Usuario

### Paciente (Visitante)
1. Ver servicios disponibles y horarios en el perfil público del médico.
2. Enviar solicitud de cita con información personal y médica.
3. Recibir confirmación WhatsApp cuando la solicitud sea aprobada.
4. Recibir notificación WhatsApp si la solicitud es rechazada (con razón).
5. Ver estado de la cita vía link en mensaje de WhatsApp.

### Médico
1. Configurar servicios disponibles con nombre, descripción, precio y duración.
2. Crear y gestionar slots de tiempo con disponibilidad y capacidad.
3. Definir reglas de disponibilidad (ej. "Sin lunes", "Horario de verano").
4. Recibir notificación WhatsApp de nuevas solicitudes.
5. Aprobar, rechazar o modificar solicitudes de cita.
6. Configurar mensajes personalizados para aprobación/rechazo.
7. Ver dashboard con solicitudes pendientes y estadísticas.

## Flujo de Usuario

```
Perfil Público /{username}
    ↓ (clic en "Agendar Cita")
Formulario de Cita
    - Seleccionar servicio
    - Seleccionar horario
    - Ingresar datos personales (nombre, teléfono, email)
    - Ingresar información médica (edad, género, motivo, síntomas)
    - Seleccionar nivel de urgencia
    ↓ Enviar Solicitud
Confirmación de Solicitud
    - "Tu solicitud ha sido enviada. Recibirás confirmación por WhatsApp."
    ↓
Dashboard del Médico
    - Notificación: Nueva solicitud de cita
    - Revisar detalles de la solicitud
    - Aprobar/Rechazar/Modificar
    ↓
Notificación al Paciente (WhatsApp)
    - Aprobada: Confirmación con detalles de la cita
    - Rechazada: Mensaje con explicación
```

## Modelo de Contenido

### medical-service (Servicio Médico)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| profileId | uuid | Perfil del médico (FK) |
| name | varchar | Nombre del servicio (ej. "Consulta Inicial") |
| description | text | Descripción del servicio |
| duration | integer | Duración en minutos |
| price | decimal | Precio del servicio |
| isActive | boolean | Si el servicio está disponible |
| createdAt | timestamp | Fecha de creación |

### time-slot (Slot de Tiempo)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| profileId | uuid | Perfil del médico (FK) |
| startTime | timestamp | Inicio del slot |
| endTime | timestamp | Fin del slot |
| status | varchar | disponible/reservado/aprobado/cancelado |
| currentReservations | integer | Citas actuales |
| maxReservations | integer | Capacidad máxima |
| createdAt | timestamp | Fecha de creación |

### reservation-request (Solicitud de Cita)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| profileId | uuid | Perfil del médico (FK) |
| slotId | uuid | Slot solicitado (FK) |
| serviceId | uuid | Servicio solicitado (FK) |
| patientName | varchar | Nombre completo del paciente |
| patientPhone | varchar | Número de WhatsApp |
| patientEmail | varchar | Email (opcional) |
| patientAge | integer | Edad del paciente |
| patientGender | varchar | Género del paciente |
| chiefComplaint | text | Motivo principal de la visita |
| symptoms | text | Síntomas actuales |
| medicalHistory | text | Historial médico relevante |
| currentMedications | text | Medicamentos actuales |
| allergies | text | Alergias conocidas |
| urgencyLevel | varchar | baja/normal/alta/urgente |
| status | varchar | pendiente/aprobado/rechazado/expirado |
| requestedTime | timestamp | Hora solicitada original |
| expiresAt | timestamp | Fecha de expiración |
| createdAt | timestamp | Fecha de creación |

### reservation (Cita Confirmada)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| profileId | uuid | Perfil del médico (FK) |
| slotId | uuid | Slot confirmado (FK) |
| serviceId | uuid | Servicio confirmado (FK) |
| requestId | uuid | Solicitud original (FK, opcional) |
| patientName | varchar | Nombre del paciente |
| patientPhone | varchar | Número de WhatsApp |
| patientEmail | varchar | Email (opcional) |
| status | varchar | confirmada/cancelada/completada/no_presentado |
| source | varchar | whatsapp/api/etc |
| notes | text | Notas internas |
| reminder24hSent | boolean | Recordatorio 24h enviado |
| reminder2hSent | boolean | Recordatorio 2h enviado |
| priceAtBooking | decimal | Precio al momento de agendar |
| paymentStatus | varchar | pendiente/pagado/cancelado |
| createdAt | timestamp | Fecha de creación |

### availability-rule (Regla de Disponibilidad)
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | uuid | Primary key |
| profileId | uuid | Perfil del médico (FK) |
| dayOfWeek | integer | 0-6 (Domingo-Sábado) |
| startTime | time | Hora de inicio diaria |
| endTime | time | Hora de fin diaria |
| isActive | boolean | Si la regla está activa |

## API Endpoints

### Públicos (Sin Auth)
```
POST /api/reservations/request
  - Enviar nueva solicitud de cita
  - Body: slotId, serviceId, patientName, patientPhone, patientEmail?, patientAge?, patientGender?, chiefComplaint?, symptoms?, medicalHistory?, currentMedications?, allergies?, urgencyLevel?

GET /api/reservations/request/:requestId
  - Obtener estado de solicitud (acceso público via token)

GET /api/reservations/patient/:phone
  - Obtener historial de solicitudes del paciente
```

### Protegidos (Auth Médico)
```
GET /api/reservations/pending/:profileId
  - Obtener todas las solicitudes pendientes

GET /api/reservations/stats/:profileId
  - Obtener estadísticas de reservas

GET /api/reservations/:profileId/services
  - Obtener servicios del médico

POST /api/reservations/services
  - Crear nuevo servicio

PUT /api/reservations/services/:id
  - Actualizar servicio

DELETE /api/reservations/services/:id
  - Eliminar servicio

GET /api/reservations/:profileId/slots
  - Obtener slots disponibles

POST /api/reservations/slots
  - Crear nuevo slot

DELETE /api/reservations/slots/:id
  - Eliminar slot

POST /api/reservations/approve
  - Aprobar solicitud de cita
  - Body: requestId, notes?, changes?

POST /api/reservations/reject
  - Rechazar solicitud de cita
  - Body: requestId, rejectionReason
```

## Dependencias
- **Módulo 02 (Perfil Público)**: Renderiza formulario y botón de citas.
- **Módulo 04 (Features)**: Toggle para visibilidad del feature.
- **Módulo 09 (WhatsApp)**: Entrega de notificaciones.
- **Módulo 06 (Dashboard)**: UI para gestión de solicitudes.
- **Módulo 01 (Auth)**: Autenticación segura del médico.
- **Módulo 10 (CRM)**: Integración con pacientes existentes.

## Notificaciones WhatsApp

### Notificación al Médico (Nueva Solicitud)
```
Nueva solicitud de cita #{requestId}

Paciente: {patientName}
Teléfono: {patientPhone}
Servicio: {serviceName}
Fecha: {appointmentDate}
Hora: {appointmentTime}
Urgencia: {urgencyLevel}

Motivo: {chiefComplaint}

Acciones: [Aprobar] [Rechazar]
Ver detalles: {dashboardUrl}
```

### Notificación al Paciente (Solicitud Recibida)
```
Hola {patientName}, tu solicitud de cita ha sido enviada.

Servicio: {serviceName}
Fecha solicitada: {date}
Estado: Pendiente de aprobación

Te notifyaremos por WhatsApp cuando el médico confirme tu cita.
```

### Notificación al Paciente (Aprobada)
```
¡Tu cita ha sido confirmada! 🎉

Detalles de tu cita:
Servicio: {serviceName}
Fecha: {appointmentDate}
Hora: {appointmentTime}
Dirección: {address}
Médico: {doctorName}

¿Necesitas reprogramar? Responde a este mensaje.
```

### Notificación al Paciente (Rechazada)
```
Lamentamos informarte que tu solicitud de cita ha sido rechazada.

Motivo: {rejectionReason}

Puedes intentar con otro horario o servicio.
¿Tienes preguntas? Responde a este mensaje.
```

## Métricas y Notas
- **Tasa de Conversión**: Aprobadas / Total de solicitudes
- **Tiempo Promedio de Aprobación**: Tiempo desde solicitud hasta aprobación
- **Tasa de No-Presentado**: Citas canceladas o no asistidas
- **Servicios Populares**: Servicios más solicitados
- **Horarios Pico**: Slots más populares

## Mejoras Futuras
- Integración con calendario (Google Calendar, Outlook)
- Pago en línea antes de confirmación
- Agendamiento recurrente
- Soporte multi-ubicación
- Acceso para asistentes/equipo
- Notificaciones SMS de respaldo
