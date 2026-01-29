# 📅 Sistema de Citas

## ¿Qué es?

El **Sistema de Citas** de MediApp es una solución completa de agendamiento médico que conecta pacientes con profesionales de la salud de forma inteligente y automatizada. Permite a los médicos recibir solicitudes de citas a través de su perfil público, gestionar su disponibilidad con slots inteligentes, y mantener a los pacientes informados mediante notificaciones automáticas por WhatsApp.

Con un flujo de aprobación flexible, los médicos pueden aceptar, rechazar o modificar solicitudes según su disponibilidad real, mientras los pacientes reciben confirmaciones instantáneas y recordatorios automáticos para reducir las inasistencias.

---

## Flujo del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FLUJO DEL SISTEMA DE CITAS                          │
└─────────────────────────────────────────────────────────────────────────────┘

    PACIENTE                          MÉDICO                         SISTEMA
       │                                │                               │
       │  1. Visita perfil público      │                               │
       │───────────────────────────────>│                               │
       │                                │                               │
       │  2. Ve servicios y horarios    │                               │
       │<───────────────────────────────│                               │
       │                                │                               │
       │  3. Completa formulario        │                               │
       │     (datos + info médica)      │                               │
       │                                │                               │
       │  4. Envía solicitud            │                               │
       │───────────────────────────────────────────────────────────────>│
       │                                │                               │
       │                                │  5. Notificación WhatsApp     │
       │                                │<──────────────────────────────│
       │                                │     "Nueva solicitud de cita" │
       │                                │                               │
       │                                │  6. Revisa detalles           │
       │                                │     en Dashboard              │
       │                                │                               │
       │                                │  7. Aprueba/Rechaza/Modifica  │
       │                                │───────────────────────────────>│
       │                                │                               │
       │  8. Recibe confirmación        │                               │
       │<──────────────────────────────────────────────────────────────│
       │     vía WhatsApp               │                               │
       │                                │                               │
       │  9. Recordatorios automáticos  │                               │
       │<──────────────────────────────────────────────────────────────│
       │     (24h y 2h antes)           │                               │
       │                                │                               │
       │  10. Seguimiento post-cita     │                               │
       │<──────────────────────────────────────────────────────────────│
       │     (48h después)              │                               │
       ▼                                ▼                               ▼

┌─────────────────────────────────────────────────────────────────────────────┐
│  ⏱️  LAS SOLICITUDES PENDIENTES EXPIRAN AUTOMÁTICAMENTE DESPUÉS DE 30 MIN  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Características para el Paciente

### 🗓️ Ver Disponibilidad en Tiempo Real

- Accede al perfil público del médico desde cualquier dispositivo
- Visualiza los servicios disponibles con precios y duración
- Consulta los horarios libres en un calendario intuitivo
- Selecciona el slot que mejor se adapte a su agenda

### 📝 Formulario de Solicitud Completo

El paciente proporciona toda la información necesaria para que el médico pueda evaluar la solicitud:

| Campo                       | Descripción                               |
| --------------------------- | ----------------------------------------- |
| **Datos Personales**        | Nombre completo, teléfono WhatsApp, email |
| **Información Demográfica** | Edad y género                             |
| **Motivo de Consulta**      | Razón principal de la visita              |
| **Síntomas Actuales**       | Descripción de síntomas presentes         |
| **Historial Médico**        | Condiciones relevantes previas            |
| **Medicamentos**            | Tratamientos actuales                     |
| **Alergias**                | Alergias conocidas                        |
| **Nivel de Urgencia**       | Baja / Normal / Alta / Urgente            |

### ✅ Confirmación Instantánea

- Recibe notificación por WhatsApp cuando el médico aprueba la cita
- Accede a los detalles completos: fecha, hora, dirección y servicio
- Link directo para ver el estado de la solicitud en cualquier momento

### 🔔 Recordatorios Automáticos

El sistema envía recordatorios automáticos para minimizar olvidos:

| Tipo                 | Momento          | Contenido                                 |
| -------------------- | ---------------- | ----------------------------------------- |
| **Confirmación**     | Inmediato        | Fecha, hora, dirección del consultorio    |
| **Recordatorio 24h** | 24 horas antes   | Recordatorio con detalles de la cita      |
| **Recordatorio 2h**  | 2 horas antes    | Recordatorio final con instrucciones      |
| **Seguimiento**      | 48 horas después | "¿Cómo se siente después de su consulta?" |

---

## Características para el Médico

### 🎯 Slots Inteligentes

- Configura horarios de atención personalizados
- Define capacidad máxima por slot (ideal para grupos o múltiples consultas)
- Establece reglas de disponibilidad recurrentes
- Gestiona excepciones (vacaciones, días especiales)

### 💼 Gestión de Servicios

Crea y administra los servicios que ofreces:

| Característica            | Beneficio                                     |
| ------------------------- | --------------------------------------------- |
| **Nombre personalizado**  | "Consulta Inicial", "Control de Rutina", etc. |
| **Descripción detallada** | Los pacientes saben exactamente qué incluye   |
| **Duración configurable** | Adapta cada servicio a tus necesidades        |
| **Precio visible**        | Transparencia desde el primer contacto        |
| **Activar/Desactivar**    | Control total sobre la visibilidad            |

### ✔️ Flujo de Aprobación Flexible

El médico mantiene el control total sobre su agenda:

```
Nueva Solicitud ──► Revisar Detalles ──► Decisión
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
              [APROBAR]                [RECHAZAR]               [MODIFICAR]
                    │                         │                         │
         Cita confirmada              Notificación            Ajustar hora/servicio
         Paciente notificado          con explicación         y luego aprobar
```

### 🚨 Niveles de Urgencia

Los pacientes indican la urgencia de su consulta para ayudar en la priorización:

| Nivel       | Indicador | Uso Recomendado                                |
| ----------- | --------- | ---------------------------------------------- |
| **Baja**    | 🟢        | Chequeos rutinarios, revisiones periódicas     |
| **Normal**  | 🔵        | Consultas generales, síntomas leves            |
| **Alta**    | 🟡        | Síntomas moderados, seguimiento importante     |
| **Urgente** | 🔴        | Situaciones que requieren atención prioritaria |

---

## Notificaciones por WhatsApp

### 📱 Para el Médico - Nueva Solicitud

```
🏥 Nueva solicitud de cita #C-2024-001

👤 Paciente: María González López
📱 Teléfono: +52 55 1234 5678

📋 Detalles:
• Servicio: Consulta Inicial
• Fecha: 15 de enero, 2025
• Hora: 10:30 AM
• Urgencia: Normal

📝 Motivo: Dolor de cabeza persistente desde hace 3 días

👉 Gestionar solicitud: https://medi.app/dashboard/citas
```

### 📱 Para el Paciente - Solicitud Recibida

```
¡Hola María! 👋

Tu solicitud de cita ha sido enviada exitosamente.

📋 Resumen:
• Servicio: Consulta Inicial
• Fecha solicitada: 15 de enero, 2025 - 10:30 AM
• Estado: ⏳ Pendiente de aprobación

Te notificaremos por WhatsApp cuando el Dr. Carlos Martínez
confirme tu cita.

📲 Ver estado: https://medi.app/cita/C-2024-001
```

### 📱 Para el Paciente - Cita Aprobada

```
¡Tu cita ha sido confirmada! 🎉

✅ CITA CONFIRMADA

📋 Detalles:
• Servicio: Consulta Inicial
• 📅 Fecha: 15 de enero, 2025
• 🕐 Hora: 10:30 AM
• 📍 Dirección: Av. Insurgentes Sur 1234, CDMX
• 👨‍⚕️ Dr. Carlos Martínez

💡 Recuerda llegar 15 minutos antes.

¿Necesitas reprogramar? Responde a este mensaje.
```

### 📱 Para el Paciente - Cita Rechazada

```
Lamentamos informarte que tu solicitud de cita no pudo ser confirmada.

📋 Solicitud:
• Servicio: Consulta Inicial
• Fecha solicitada: 15 de enero, 2025 - 10:30 AM

📝 Motivo: El horario solicitado ya no está disponible.
   Por favor, selecciona otro horario.

🔄 Puedes intentar con otro horario aquí:
https://medi.app/dr-carlos-martinez

¿Tienes preguntas? Responde a este mensaje.
```

---

## Tabla de Recordatorios Automáticos

| Tipo                 | Timing                      | Contenido del Mensaje                                                                          | Objetivo                                                   |
| -------------------- | --------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| **Confirmación**     | Inmediato tras aprobación   | Fecha, hora exacta, dirección completa del consultorio, nombre del médico, servicio contratado | Proporcionar toda la información necesaria para asistir    |
| **Recordatorio 24h** | 24 horas antes de la cita   | Recordatorio de la cita, detalles de fecha/hora, dirección, recomendaciones previas            | Reducir olvidos con anticipación suficiente para reagendar |
| **Recordatorio 2h**  | 2 horas antes de la cita    | Recordatorio final, instrucciones de último momento, número de contacto de emergencia          | Última alerta antes de la consulta                         |
| **Seguimiento**      | 48 horas después de la cita | "¿Cómo se siente después de su consulta?", opción de agendar control, canal de comunicación    | Cierre del ciclo de atención y fidelización                |

---

## Beneficios para el Médico

> 💬 **"Desde que implementé el Sistema de Citas de MediApp, mis inasistencias bajaron un 60%. Los recordatorios automáticos mantienen a mis pacientes informados y el flujo de aprobación me da el control total sobre mi agenda. Ahora puedo organizar mi día sin preocuparme por citas sorpresa."**
>
> — _Dra. Ana María López, Médico General_

### Ventajas Clave:

- ✅ **Reduce inasistencias** hasta un 60% con recordatorios automáticos
- ✅ **Control total** sobre tu agenda con aprobación manual
- ✅ **Ahorra tiempo** automatizando confirmaciones y recordatorios
- ✅ **Mejor experiencia** para pacientes con comunicación instantánea
- ✅ **Profesionalismo** con notificaciones personalizadas por WhatsApp
- ✅ **Flexibilidad** para modificar horarios al aprobar solicitudes

---

## Copy para Marketing

### Frases para Redes Sociales

**Instagram/Facebook:**

- "¿Cansado de las inasistencias? 📅 Nuestro Sistema de Citas con recordatorios automáticos por WhatsApp reduce las faltas hasta un 60%. Tu agenda, bajo control."

- "El paciente solicita, tú decides. ✔️ Con MediApp, mantienes el control total de tu agenda médica. Aprobás, rechazás o modificás cada cita según tu disponibilidad real."

- "Tu tiempo es valioso ⏰ Deja que nuestro Sistema de Citas se encargue de las confirmaciones, recordatorios y seguimientos automáticos. Vos solo concentrate en tus pacientes."

**LinkedIn:**

- "La digitalización de la agenda médica no debería significar perder el control. Nuestro Sistema de Citas combina la comodidad del agendamiento online con la flexibilidad de aprobación manual que los médicos necesitan."

- "Cada minuto cuenta en la práctica médica. Por eso diseñamos un sistema que automatiza la comunicación con pacientes (confirmaciones, recordatorios 24h y 2h, seguimientos) mientras te mantiene al mando de cada solicitud."

**Twitter/X:**

- "📲 Paciente solicita cita → 📱 Vos recibís WhatsApp → ✅ Aprobás en segundos → 🔔 Recordatorios automáticos. Así de simple es agendar con MediApp."

- "¿Sabías que el 40% de las inasistencias se deben a olvidos? Nuestros recordatorios automáticos 24h y 2h antes reducen drásticamente este problema."

### Texto para Email Marketing

**Asunto:** Reduce las inasistencias y toma el control de tu agenda médica

**Cuerpo:**

```
¿Te frustran las citas canceladas a último momento?

Con el Sistema de Citas de MediApp, transformás la forma de
gestionar tu agenda:

✓ Recibís solicitudes con toda la información médica del paciente
✓ Decidís qué citas aprobar, rechazar o modificar
✓ Tus pacientes reciben confirmaciones instantáneas por WhatsApp
✓ Recordatorios automáticos 24h y 2h antes de cada cita
✓ Seguimiento post-consulta para completar la experiencia

Todo automático. Todo profesional. Todo bajo tu control.

[Descubrí cómo funciona] [Agendá una demo]
```

### Texto para Página Web / Landing

**Headline:**
"Sistema de Citas Inteligente: Tu Agenda, Tus Reglas"

**Subheadline:**
"Agendamiento online con aprobación manual, recordatorios automáticos por WhatsApp y control total de tu tiempo. Diseñado para médicos que valoran su agenda."

**Bullet Points:**

- 🔔 **Recordatorios automáticos** que reducen inasistencias hasta 60%
- ✋ **Aprobación manual** de cada solicitud, manteniendo el control
- 📱 **Notificaciones por WhatsApp** para confirmaciones instantáneas
- 🎯 **Slots inteligentes** con capacidad configurable por horario
- 🚨 **Niveles de urgencia** para priorizar atenciones
- ⏱️ **Expiración automática** de solicitudes pendientes (30 min)

---

## Preguntas Frecuentes (FAQ)

### ¿El paciente puede agendar directamente sin mi aprobación?

**No.** El sistema está diseñado para que el médico mantenga el control. Los pacientes envían solicitudes que deben ser aprobadas, rechazadas o modificadas por el médico antes de confirmar la cita.

### ¿Qué pasa si no respondo una solicitud?

Las solicitudes pendientes expiran automáticamente después de **30 minutos**. El paciente recibe una notificación informando que el horario ya no está disponible y puede intentar con otro slot.

### ¿Puedo modificar la hora o servicio al aprobar?

**Sí.** Al revisar una solicitud, podés ajustar el horario, cambiar el servicio o hacer modificaciones según tu disponibilidad real antes de confirmar la cita.

### ¿Los recordatorios se envían automáticamente?

**Sí.** Una vez aprobada la cita, el sistema envía automáticamente:

- Confirmación inmediata
- Recordatorio 24 horas antes
- Recordatorio 2 horas antes
- Seguimiento 48 horas después

### ¿Cómo se notifica al médico de nuevas solicitudes?

El médico recibe una notificación instantánea por **WhatsApp** con todos los detalles del paciente, el servicio solicitado, fecha, hora y nivel de urgencia, incluyendo un link directo al dashboard para gestionar la solicitud.

### ¿Puedo configurar diferentes servicios con distintas duraciones?

**Sí.** Podés crear múltiples servicios (consulta inicial, control, procedimiento, etc.) cada uno con su propia duración, descripción y precio.

### ¿Qué información médica proporciona el paciente?

El formulario incluye: datos personales, edad, género, motivo de consulta, síntomas actuales, historial médico relevante, medicamentos actuales y alergias conocidas.

### ¿Funciona para consultas grupales o con múltiples pacientes?

**Sí.** Los slots inteligentes permiten definir una capacidad máxima por horario, ideal para sesiones grupales, talleres o atención de múltiples pacientes en el mismo horario.

### ¿Puedo desactivar temporalmente las citas?

**Sí.** Podés desactivar el feature de citas desde tu dashboard cuando quieras, ocultando el botón de agendamiento de tu perfil público.

### ¿Qué sucede si un paciente no asiste a la cita?

El sistema registra las inasistencias, permitiéndote identificar patrones y tomar decisiones informadas sobre futuras solicitudes de ese paciente.

---

## Métricas Clave

| Métrica                           | Descripción                                             | Impacto                                                |
| --------------------------------- | ------------------------------------------------------- | ------------------------------------------------------ |
| **Tasa de Conversión**            | Porcentaje de solicitudes aprobadas vs. total recibidas | Indica la efectividad del flujo de agendamiento        |
| **Tiempo Promedio de Aprobación** | Minutos desde solicitud hasta aprobación/rechazo        | Mide la velocidad de respuesta del médico              |
| **Tasa de No-Presentado**         | Citas canceladas o no asistidas vs. total confirmadas   | El objetivo es reducirla con recordatorios             |
| **Servicios Populares**           | Ranking de servicios más solicitados                    | Ayuda a optimizar oferta y precios                     |
| **Horarios Pico**                 | Slots con mayor demanda                                 | Permite ajustar disponibilidad y capacidad             |
| **Tasa de Expiración**            | Solicitudes que expiraron por falta de respuesta        | Identifica necesidad de mejora en tiempos de respuesta |
| **Satisfacción del Paciente**     | Feedback post-cita sobre el proceso de agendamiento     | Mide calidad de la experiencia                         |
| **Uso de WhatsApp**               | Porcentaje de notificaciones entregadas exitosamente    | Indica efectividad del canal de comunicación           |

---

## Resumen

El **Sistema de Citas** de MediApp es la solución perfecta para médicos que buscan modernizar su agenda sin perder el control. Combinando la comodidad del agendamiento online con la seguridad de la aprobación manual, y potenciado por notificaciones automáticas por WhatsApp, este sistema reduce inasistencias, ahorra tiempo administrativo y mejora la experiencia tanto para médicos como para pacientes.

**¿Listo para transformar tu agenda médica?** 🚀
