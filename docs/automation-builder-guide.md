# Guía del Usuario: Constructor de Automatizaciones

> **CitaBot** - Centro de Ayuda  
> Versión 1.0 | Marzo 2026

---

## Tabla de Contenidos

1. [Introducción](#introducción)
2. [Conceptos Básicos](#conceptos-básicos)
3. [Crear una Automatización](#crear-una-automatización)
4. [Configurar Disparadores](#configurar-disparadores)
5. [Configurar Acciones](#configurar-acciones)
6. [Plantillas Predefinidas](#plantillas-predefinidas)
7. [Monitorear Ejecuciones](#monitorear-ejecuciones)
8. [Mejores Prácticas](#mejores-prácticas)

---

## Introducción

El **Constructor de Automatizaciones** de CitaBot te permite crear flujos de trabajo automatizados que se ejecutan en respuesta a eventos específicos o en horarios programados. Puedes automatizar tareas como:

- Enviar recordatorios de citas por WhatsApp
- Notificar a tus clientes sobre promociones
- Crear tareas de seguimiento
- Actualizar automáticamente el estado de reservas
- Enviar mensajes de cumpleaños

---

## Conceptos Básicos

### Componentes de una Automatización

Una automatización en CitaBot se compone de tres elementos principales:

| Elemento | Descripción |
|----------|-------------|
| **Disparador (Trigger)** | Evento que inicia la automatización (ej: cita creada, cliente inactivo, horario específico) |
| **Condiciones** | Filtros opcionales para determinar cuándo ejecutar la automatización |
| **Acciones** | Tareas que se realizan cuando se cumple el disparador |

### Tipos de Disparadores

#### 1. Disparador de Eventos
Se ejecuta cuando ocurre un evento específico en el sistema:

- `appointment.created` - Nueva cita creada
- `appointment.completed` - Cita completada
- `appointment.cancelled` - Cita cancelada
- `appointment.no_show` - Cliente no asistió
- `client.registered` - Nuevo cliente registrado
- `low_stock` - Producto bajo stock mínimo

#### 2. Disparador Programado
Se ejecuta en horarios específicos usando expresiones cron:

- Diariamente a una hora específica
- Semanalmente en días seleccionados
- Mensualmente en fechas específicas

#### 3. Disparador de Condición
Se ejecuta cuando se cumplen condiciones específicas:

- Cliente sin cita en X días
- Stock bajo el mínimo
- Cliente con fecha de cumpleaños próxima

### Tipos de Acciones

| Acción | Descripción |
|--------|-------------|
| **WhatsApp** | Enviar mensaje por WhatsApp al cliente |
| **Email** | Enviar correo electrónico |
| **Actualizar Registro** | Modificar datos de un cliente, cita o servicio |
| **Crear Tarea** | Generar una tarea de seguimiento |

---

## Crear una Automatización

### Paso 1: Acceder al Constructor

1. Inicia sesión en tu dashboard de CitaBot
2. Navega a **Automatizaciones** en el menú lateral
3. Haz clic en **+ Nueva Automatización**

### Paso 2: Definir Nombre y Descripción

```
Nombre: Recordatorio de Cita
Descripción: Envía recordatorio 24h antes de la cita
```

### Paso 3: Seleccionar Disparador

Elige el tipo de disparador y configura sus parámetros:

```
Tipo: Programado
Expresión Cron: 0 14 * * * (diariamente a las 2 PM)
```

### Paso 4: (Opcional) Agregar Condiciones

Puedes agregar filtros para ejecutar la automatización solo cuando se cumplan ciertas condiciones:

```
Campo: status
Operador: equals
Valor: confirmed
```

### Paso 5: Configurar Acciones

Agrega las acciones que se ejecutarán:

1. Haz clic en **+ Agregar Acción**
2. Selecciona el tipo de acción
3. Configura los parámetros

---

## Configurar Disparadores

### Disparador de Eventos

```json
{
  "eventType": "appointment.created",
  "filters": {
    "status": "confirmed"
  }
}
```

### Disparador Programado

```json
{
  "cronExpression": "0 9 * * 1-5",
  "timezone": "America/Lima",
  "daysOfWeek": [1, 2, 3, 4, 5],
  "hours": [9, 14, 18]
}
```

**Expresiones Cron Comunes:**

| Expresión | Significado |
|----------|-------------|
| `0 9 * * *` | Diariamente a las 9:00 AM |
| `0 14 * * 1-5` | Lunes a viernes a las 2:00 PM |
| `0 10 1 * *` | Primer día del mes a las 10:00 AM |
| `0 8 * * 0` | Domingos a las 8:00 AM |

### Disparador de Condición

```json
{
  "entityType": "client",
  "conditions": [
    {
      "field": "lastAppointmentDate",
      "operator": "lt",
      "value": "30d"
    }
  ],
  "logicalOperator": "AND",
  "pollInterval": 3600
}
```

---

## Configurar Acciones

### Acción de WhatsApp

```json
{
  "type": "whatsapp",
  "recipientType": "client",
  "message": "¡Hola {{client.name}}! Te recordampos que tienes una cita mañana a las {{appointment.time}}.",
  "templateId": "reminder_template"
}
```

**Parámetros:**
- **recipientType**: `client` (cliente actual), `phone` (número específico), `variable` (desde datos)
- **phoneNumber**: Número de teléfono (si recipientType es `phone`)
- **clientId**: ID del cliente (si recipientType es `client`)
- **variablePath**: Ruta de datos dinámicos (si recipientType es `variable`)
- **message**: Mensaje con soporte para variables `{{campo}}`
- **templateId**: ID de plantilla de WhatsApp (opcional)

### Acción de Email

```json
{
  "type": "email",
  "recipientType": "client",
  "subject": "Confirmación de tu cita en {{business.name}}",
  "body": "Hola {{client.name}}, tu cita ha sido confirmada...",
  "fromName": "Mi Negocio"
}
```

### Acción de Actualizar Registro

```json
{
  "type": "update_record",
  "entityType": "appointment",
  "entityIdType": "variable",
  "entityIdVariablePath": "appointment.id",
  "updates": {
    "reminderSent": true,
    "reminderSentAt": "{{timestamp}}"
  }
}
```

### Acción de Crear Tarea

```json
{
  "type": "create_task",
  "title": "Seguimiento: {{client.name}}",
  "description": "Contactar al cliente para confirmar asistencia",
  "assignToType": "owner",
  "dueDateType": "relative",
  "relativeDueDate": "+1d",
  "priority": "high"
}
```

---

## Plantillas Predefinidas

CitaBot incluye plantillas de automatizaciones por industria que puedes usar directamente:

### Belleza

| Plantilla | Descripción |
|-----------|-------------|
| **Recordatorio de Tratamiento** | Envía recordatorio 24h antes del tratamiento |
| **Seguimiento Post-Tratamiento** | Mensaje de seguimiento 2 días después |
| **Reactivación de Cliente** | Contacta clientes inactivos por 60+ días |
| **Promoción de Cumpleaños** | Descuento especial en el mes de cumpleaños |

### Fitness

| Plantilla | Descripción |
|-----------|-------------|
| **Recordatorio de Clase** | Envía recordatorio 2h antes de la clase |
| **Reactivación de Member** | Contacta miembros sin actividad reciente |
| **Recordatorio de Renovación** | Notifica 7 días antes del vencimiento |

### General

| Plantilla | Descripción |
|-----------|-------------|
| **Bienvenida** | Mensaje de bienvenida a nuevos clientes |
| **Confirmación de Cita** | Confirma la cita al crearla |
| **Seguimiento No-Asistió** | Follow-up 1h después de no-show |

### Aplicar una Plantilla

1. Ve a **Automatizaciones** > **Plantillas**
2. Filtra por tipo de negocio
3. Haz clic en **Usar** en la plantilla deseada
4. Personaliza los parámetros
5. Activa la automatización

---

## Monitorear Ejecuciones

### Ver Historial de Ejecuciones

1. Ve a **Automatizaciones**
2. Selecciona la automatización
3. Haz clic en **Ver Logs**

Cada ejecución muestra:
- Fecha y hora de ejecución
- Datos del disparador (trigger data)
- Acciones ejecutadas
- Resultado (éxito/error)
- Mensaje de error (si falló)

### Métricas de Automatización

En **Analytics** > **Automatizaciones** puedes ver:

- Total de ejecuciones
- Tasa de éxito
- Automatizaciones más utilizadas
- Tendencia de ejecuciones en el tiempo

### Reintentar Ejecuciones Fallidas

Si una ejecución falló:

1. Ve al log de la automatización
2. Identifica la ejecución fallida
3. Haz clic en **Reintentar**

---

## Mejores Prácticas

### ✅ Hacer

- **Mantén las automatizaciones simples**: Es mejor tener varias automatizaciones pequeñas que una muy compleja
- **Usa condiciones**: Filtra cuándo NO ejecutar para evitar mensajes innecesarios
- **Prueba antes de activar**: Ejecuta manualmente antes de activar
- **Monitorea los logs**: Revisa regularmente las ejecuciones para detectar problemas
- **Personaliza los mensajes**: Usa el nombre del cliente y otros datos para hacerlos más personales

### ❌ Evitar

- **No envíes demasiados mensajes**: El cliente puede sentirse spammado
- **No actives todo a la vez**: Ve probando cada automatización individualmente
- **No ignores los errores**: Revisa y corrige las automatizaciones que fallan
- **No uses mensajes genéricos**: Personaliza siempre que sea posible

### Variables Disponibles

Puedes usar las siguientes variables en tus mensajes:

| Variable | Descripción |
|----------|-------------|
| `{{client.name}}` | Nombre del cliente |
| `{{client.phone}}` | Teléfono del cliente |
| `{{appointment.date}}` | Fecha de la cita |
| `{{appointment.time}}` | Hora de la cita |
| `{{appointment.service}}` | Nombre del servicio |
| `{{business.name}}` | Nombre de tu negocio |
| `{{business.phone}}` | Teléfono del negocio |
| `{{staff.name}}` | Nombre del staff asignado |

---

## Solución de Problemas

### Mi automatización no se ejecuta

1. Verifica que esté **activada** (toggle en ON)
2. Revisa los **logs** para ver si hubo errores
3. Verifica que el **disparador** esté configurado correctamente
4. Confirma que las **condiciones** se estén cumpliendo

### La acción de WhatsApp no se envía

1. Verifica que el cliente tenga **número de teléfono** registrado
2. Confirma que la **Evolution API** esté configurada
3. Revisa el **log de errores** para el mensaje específico
4. Verifica que el **número esté en formato internacional**

### El mensaje tiene datos incorrectos

1. Verifica la **sintaxis de las variables**
2. Confirma que los **campos existan** en el objeto de datos
3. Revisa el **log de ejecución** para ver qué datos se recibieron

---

## Próximos Pasos

¿Necesitas más ayuda? Explora estos recursos:

- [API Documentation](./api-docs.md)
- [Guía de Inventory](./inventory-guide.md)
- [Playbook de Migración](./migration-playbook.md)

---

*¿Te fue útil esta guía? Contáctanos soporte@citabot.io*
