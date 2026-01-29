# 💬 WhatsApp Business

## ¿Qué es?

El módulo de **WhatsApp Business** permite a los profesionales de la salud conectar su cuenta de WhatsApp Business para comunicarse directamente con sus pacientes de forma automatizada y personalizada.

Con esta integración, puedes enviar confirmaciones de citas, recordatorios automáticos, seguimientos post-consulta y mensajes de cumpleaños, todo desde una plataforma centralizada que se sincroniza con tu perfil público.

---

## Conexión mediante Código QR

Conectar tu WhatsApp Business es rápido y sencillo:

1. **Accede a Configuración** → Pestaña WhatsApp
2. **Haz clic en "Conectar WhatsApp Business"**
3. **Escanea el código QR** que aparece en pantalla con tu aplicación de WhatsApp Business
4. **¡Listo!** Tu cuenta queda vinculada y puedes empezar a enviar mensajes

> 💡 **Tip:** Mantén tu teléfono conectado a internet para garantizar la sincronización continua.

---

## Plantillas de Mensajes

El sistema incluye **5 plantillas predefinidas** diseñadas para las comunicaciones más comunes en el sector salud. Cada plantilla admite variables personalizables que se reemplazan automáticamente con los datos del paciente.

### 1. Confirmación de Cita

**Uso:** Envío automático inmediatamente después de que el paciente agenda una cita.

**Variables disponibles:**

- `{nombre}` - Nombre del paciente
- `{fecha}` - Fecha de la cita
- `{hora}` - Hora programada
- `{doctor}` - Nombre del médico
- `{especialidad}` - Especialidad médica

**Ejemplo:**

```
¡Hola {nombre}! 👋

Tu cita ha sido confirmada:

📅 Fecha: {fecha}
🕐 Hora: {hora}
👨‍⚕️ Dr./Dra. {doctor}
🏥 Especialidad: {especialidad}

Te esperamos. ¡Gracias por confiar en nosotros!
```

---

### 2. Recordatorio 24h

**Uso:** Recordatorio enviado 24 horas antes de la cita programada.

**Variables disponibles:**

- `{nombre}` - Nombre del paciente
- `{fecha}` - Fecha de la cita
- `{hora}` - Hora programada
- `{direccion}` - Dirección de la consulta
- `{doctor}` - Nombre del médico

**Ejemplo:**

```
¡Hola {nombre}! 📅

Te recordamos que mañana tienes una cita:

🕐 Hora: {hora}
👨‍⚕️ Con: Dr./Dra. {doctor}
📍 Dirección: {direccion}

Por favor, llega 15 minutos antes. Si necesitas cancelar o reprogramar, contáctanos con anticipación.

¡Te esperamos!
```

---

### 3. Recordatorio 2h

**Uso:** Alerta final enviada 2 horas antes de la consulta.

**Variables disponibles:**

- `{nombre}` - Nombre del paciente
- `{hora}` - Hora programada
- `{doctor}` - Nombre del médico
- `{direccion}` - Dirección de la consulta

**Ejemplo:**

```
¡Hola {nombre}! ⏰

Tu cita es en 2 horas:

🕐 {hora}
👨‍⚕️ Dr./Dra. {doctor}
📍 {direccion}

No olvides traer tus estudios previos y tu identificación.

¡Nos vemos pronto!
```

---

### 4. Seguimiento Post-consulta

**Uso:** Mensaje de seguimiento enviado 24-48 horas después de la consulta.

**Variables disponibles:**

- `{nombre}` - Nombre del paciente
- `{doctor}` - Nombre del médico
- `{fecha_consulta}` - Fecha de la consulta realizada
- `{mensaje_personalizado}` - Nota personalizada del médico

**Ejemplo:**

```
¡Hola {nombre}! 💙

Esperamos que te encuentres bien después de tu consulta del {fecha_consulta}.

{mensaje_personalizado}

Si tienes alguna duda sobre tu tratamiento o necesitas agendar tu próxima cita, estamos aquí para ayudarte.

Saludos,
Dr./Dra. {doctor}
```

---

### 5. Felicitación de Cumpleaños

**Uso:** Mensaje automático enviado el día del cumpleaños del paciente.

**Variables disponibles:**

- `{nombre}` - Nombre del paciente
- `{doctor}` - Nombre del médico
- `{descuento}` - Descuento especial de cumpleaños (opcional)

**Ejemplo:**

```
¡Feliz Cumpleaños, {nombre}! 🎉🎂

En este día especial, el equipo del Dr./Dra. {doctor} te desea mucha salud, felicidad y bienestar.

{descuento}

¡Gracias por confiar en nosotros para cuidar de tu salud!

Con cariño,
Tu equipo médico 💙
```

---

## Seguimiento de Entregas

Cada mensaje enviado cuenta con seguimiento en tiempo real. Conoce exactamente el estado de tus comunicaciones:

| Estado        | Descripción                                               | Icono |
| ------------- | --------------------------------------------------------- | ----- |
| **Enviado**   | El mensaje ha sido enviado desde nuestra plataforma       | 📤    |
| **Entregado** | El mensaje llegó al teléfono del paciente                 | ✅    |
| **Leído**     | El paciente abrió y vio el mensaje                        | 👁️    |
| **Fallido**   | No se pudo entregar (número inválido, sin conexión, etc.) | ❌    |

### Beneficios del Seguimiento

- **Confirma recepción:** Sabes que tu mensaje llegó al destinatario
- **Optimiza comunicación:** Identifica números incorrectos o inactivos
- **Mejora engagement:** Detecta qué mensajes generan mayor apertura
- **Gestiona reenvíos:** Reintenta automáticamente los mensajes fallidos

---

## Integración con Perfil Público

Tu número de WhatsApp Business se integra directamente con tu **perfil público profesional**:

### Botón de Contacto WhatsApp

- Los pacientes pueden iniciar una conversación directa desde tu perfil público
- Al hacer clic, se abre WhatsApp con un mensaje predefinido de saludo
- Facilita la comunicación inmediata sin necesidad de guardar el número

### Ventajas de la Integración

✅ **Mayor alcance:** Los pacientes te encuentran y contactan fácilmente  
✅ **Comunicación directa:** Sin intermediarios ni formularios complejos  
✅ **Disponibilidad 24/7:** Los pacientes pueden escribirte en cualquier momento  
✅ **Respuesta rápida:** Mensajes instantáneos para consultas urgentes

---

## Configuración Rápida

Sigue estos pasos para empezar a usar WhatsApp Business:

### Paso 1: Conectar tu Cuenta

1. Ve a **Configuración** → **WhatsApp**
2. Haz clic en **"Conectar WhatsApp Business"**
3. Escanea el código QR con tu app de WhatsApp Business

### Paso 2: Personalizar Plantillas

1. Revisa las plantillas predefinidas
2. Personaliza los mensajes según tu estilo
3. Configura las variables que deseas incluir

### Paso 3: Activar Automatizaciones

1. Selecciona qué mensajes deseas automatizar
2. Configura los horarios de envío (24h antes, 2h antes, etc.)
3. Activa las felicitaciones de cumpleaños

### Paso 4: Probar el Sistema

1. Envía un mensaje de prueba a tu propio número
2. Verifica que las variables se reemplacen correctamente
3. Confirma que los estados de entrega funcionan

---

## Beneficios para el Médico

> 💬 **"Desde que implementé WhatsApp Business en mi práctica, he reducido las inasistencias en un 40% y mejorado significativamente la satisfacción de mis pacientes. Los recordatorios automáticos me ahorran horas de trabajo administrativo cada semana."**
>
> — _Dr. Carlos Mendoza, Médico General_

### Ventajas Clave

🕐 **Ahorro de tiempo:** Automatiza recordatorios y confirmaciones  
💰 **Reduce inasistencias:** Los pacientes recuerdan sus citas  
⭐ **Mejora experiencia:** Comunicación directa y personalizada  
📈 **Aumenta fidelización:** Seguimiento post-consulta profesional  
🔒 **Confiable:** Entrega garantizada con seguimiento en tiempo real

---

## Copy para Marketing

### Frases Listas para Usar

**Para redes sociales:**

> "📲 ¿Sabías que puedes recibir recordatorios de tus citas directamente en WhatsApp? Agenda tu consulta y olvídate de olvidar tus citas médicas. ¡Tu salud es nuestra prioridad!"

> "💬 ¿Preguntas sobre tu tratamiento? Escríbenos por WhatsApp y te responderemos a la brevedad. Comunicación directa con tu médico de confianza."

**Para correos electrónicos:**

> "Simplificamos tu experiencia médica. Ahora recibirás:
>
> - Confirmaciones de citas al instante
> - Recordatorios 24h y 2h antes
> - Seguimiento personalizado post-consulta
>
> Todo directamente en tu WhatsApp. ¡Más fácil, imposible!"

**Para el perfil público:**

> "🩺 **Contacto directo vía WhatsApp**
>
> ¿Tienes dudas? Escríbeme directamente por WhatsApp Business.
>
> - Respuesta en menos de 24 horas
> - Recordatorios automáticos de citas
> - Atención personalizada garantizada"

**Para promociones:**

> "🎉 ¡Cumpleaños feliz y saludable!
>
> Este mes de tu cumpleaños, disfruta de un 15% de descuento en tu próxima consulta. Te enviaremos los detalles por WhatsApp. ¡Celebra cuidando de ti!"

---

## Preguntas Frecuentes (FAQ)

### ¿Necesito una cuenta de WhatsApp Business específica?

Sí, recomendamos usar WhatsApp Business para acceder a funciones adicionales como respuestas rápidas, catálogos de servicios y estadísticas de mensajería.

### ¿Los pacientes necesitan guardar mi número para recibir mensajes?

No. Una vez que el paciente agenda una cita, el sistema puede enviarle mensajes automáticamente, siempre que tenga un número de teléfono válido registrado.

### ¿Qué pasa si el mensaje no se entrega?

El sistema intentará el reenvío automáticamente hasta 3 veces. Si después de los intentos no se logra la entrega, se marcará como "Fallido" y podrás verificar el número de contacto del paciente.

### ¿Puedo personalizar las plantillas?

Sí, todas las plantillas son personalizables. Puedes modificar el texto, agregar emojis y configurar qué variables incluir en cada mensaje.

### ¿Los mensajes tienen algún costo adicional?

Los mensajes se envían a través de tu conexión de WhatsApp Business estándar. No hay costos adicionales por parte de nuestra plataforma, solo tu plan de datos habitual.

### ¿Qué tan seguros son los mensajes?

Todos los mensajes se transmiten mediante la infraestructura segura de WhatsApp con cifrado de extremo a extremo. Además, nuestra plataforma cumple con las normativas de protección de datos de salud.

### ¿Puedo enviar mensajes masivos a todos mis pacientes?

Por el momento, el sistema está diseñado para comunicaciones personalizadas individuales (confirmaciones, recordatorios, seguimientos). Las funciones de mensajería masiva estarán disponibles en futuras actualizaciones.

### ¿Qué pasa si cambio de número de teléfono?

Puedes desconectar tu número actual y conectar uno nuevo en cualquier momento desde la configuración. Los mensajes pendientes se actualizarán automáticamente.

---

## Métricas Clave

Monitorea el rendimiento de tu comunicación mediante nuestras métricas integradas:

| Métrica                        | Descripción                                                    | Objetivo Recomendado    |
| ------------------------------ | -------------------------------------------------------------- | ----------------------- |
| **Tasa de Conexión**           | % de profesionales que conectan WhatsApp Business exitosamente | > 85%                   |
| **Tasa de Entrega**            | Mensajes entregados / Total de mensajes enviados               | > 95%                   |
| **Tasa de Apertura**           | Mensajes leídos / Mensajes entregados                          | > 70%                   |
| **Uso de Plantillas**          | Plantillas más utilizadas por los profesionales                | Confirmación de cita #1 |
| **Tiempo de Respuesta**        | Tiempo promedio entre envío y confirmación de entrega          | < 5 segundos            |
| **Adopción de Función**        | Profesionales usando WhatsApp / Total de activos               | > 60%                   |
| **Reducción de Inasistencias** | Disminución en citas no atendidas después de implementación    | > 30%                   |
| **Satisfacción del Paciente**  | Calificación promedio de comunicación post-consulta            | > 4.5/5                 |

### Dashboard de Métricas

Accede a un panel visual con:

- Gráficos de envío por día/semana/mes
- Comparativa de efectividad por tipo de plantilla
- Mapa de calor de horarios de mayor apertura
- Alertas de números con alta tasa de fallos

---

## Características Técnicas Destacadas

- **Arquitectura Multi-tenant:** Cada profesional tiene su propia instancia aislada
- **Cola de Mensajes Asíncrona:** Envío garantizado incluso con alta demanda
- **Sistema de Reintentos:** Recuperación automática ante fallos temporales
- **Limitación de Tasa:** Protección contra spam y uso abusivo
- **Webhooks en Tiempo Real:** Actualizaciones instantáneas de estado
- **Cifrado de Datos:** Seguridad de nivel empresarial

---

_Última actualización: Enero 2026_
