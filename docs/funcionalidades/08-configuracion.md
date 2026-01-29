# ⚙️ Configuración

Personaliza cada aspecto de tu experiencia en MediApp para que la plataforma se adapte perfectamente a tu práctica médica.

---

## ¿Qué es?

El módulo de Configuración es tu centro de control personal. Aquí gestionas todos los aspectos de tu cuenta, desde datos básicos hasta configuraciones avanzadas de tu Agente IA y horarios de atención. Es el lugar donde transformas MediApp en una herramienta verdaderamente personalizada para tu consultorio.

---

## 📋 Datos del Perfil

Mantén tu información profesional actualizada para que los pacientes te encuentren y contacten fácilmente.

### Información Básica

| Campo                 | Descripción                                   | Editable |
| --------------------- | --------------------------------------------- | -------- |
| **Nombre de usuario** | Tu URL personalizada (mediapp.app/{username}) | ✅ Sí    |
| **Email**             | Correo principal de la cuenta                 | ✅ Sí    |
| **Nombre completo**   | Tu nombre profesional                         | ✅ Sí    |
| **Especialidad**      | Tu área médica                                | ✅ Sí    |
| **Número de cédula**  | Identificación profesional                    | ✅ Sí    |

### Seguridad de la Cuenta

| Campo                    | Descripción                | Requisitos                  |
| ------------------------ | -------------------------- | --------------------------- |
| **Contraseña actual**    | Verificación de identidad  | Requerida para cambios      |
| **Nueva contraseña**     | Actualización de seguridad | Mínimo 8 caracteres         |
| **Confirmar contraseña** | Validación de coincidencia | Debe coincidir con la nueva |

> 💡 **Consejo:** Tu nombre de usuario debe ser único en toda la plataforma. Si tu nombre profesional ya está tomado, considera agregar tu especialidad o ciudad.

---

## 📱 WhatsApp Business

Conecta tu número de WhatsApp para habilitar la comunicación directa con pacientes y las capacidades de tu Agente IA.

### Configuración del Número

| Campo                  | Descripción                 | Ejemplo                        |
| ---------------------- | --------------------------- | ------------------------------ |
| **Número de WhatsApp** | Tu línea de contacto        | +52 55 1234 5678               |
| **Nombre de display**  | Cómo te verán los pacientes | Dra. María González            |
| **Estado de conexión** | Verificación del servicio   | ✅ Conectado / ❌ Desconectado |

### Funciones Habilitadas

- ✅ **Mensajes directos** - Pacientes pueden escribirte desde tu página
- ✅ **Agente IA vía WhatsApp** - Tu asistente virtual responde automáticamente
- ✅ **Notificaciones de citas** - Confirmaciones y recordatorios automáticos
- ✅ **Alertas del sistema** - Notificaciones importantes de tu cuenta

---

## 🤖 Configuración del Agente IA

Personaliza cómo tu asistente virtual interactúa con los pacientes. Esta es una de las configuraciones más importantes de tu cuenta.

### Información del Consultorio

Proporciona contexto para que el Agente IA responda con precisión:

| Campo                      | Descripción                   | Ejemplo                                 |
| -------------------------- | ----------------------------- | --------------------------------------- |
| **Nombre del consultorio** | Identificación de tu práctica | Centro Médico del Valle                 |
| **Dirección**              | Ubicación física              | Av. Principal 123, Ciudad               |
| **Teléfono fijo**          | Línea alternativa             | (55) 1234-5678                          |
| **Horario de atención**    | Cuándo estás disponible       | Lun-Vie 9:00-18:00                      |
| **Servicios principales**  | Lo que ofreces                | Consulta general, pediatría, vacunación |
| **Formas de pago**         | Métodos aceptados             | Efectivo, tarjeta, transferencia        |

### Tono de Respuesta

Define la personalidad de tu Agente IA:

| Opción          | Descripción                         | Ideal para                                              |
| --------------- | ----------------------------------- | ------------------------------------------------------- |
| **Formal**      | Técnico y profesional               | Especialistas, cirujanos, consultas de alta complejidad |
| **Profesional** | Balanceado entre formal y accesible | La mayoría de las prácticas médicas                     |
| **Cercano**     | Amigable y accesible                | Pediatras, medicina familiar, primer contacto           |
| **Amigable**    | Conversacional y cálido             | Dentistas, estética, bienestar                          |
| **Directo**     | Breve y conciso                     | Médicos con alta demanda, consultas rápidas             |

> 🎯 **Recomendación:** El tono "Profesional" funciona para el 80% de los médicos. Solo cámbialo si tu especialidad o estilo de práctica lo requieren.

### Preguntas Frecuentes (FAQ) Personalizadas

Entrena a tu Agente IA con respuestas específicas:

```
Pregunta: ¿Cuánto dura una consulta general?
Respuesta: Las consultas generales tienen una duración aproximada de 30 minutos.
Sin embargo, el tiempo puede variar según la complejidad del caso.

Pregunta: ¿Necesito traer estudios previos?
Respuesta: Si tienes estudios recientes relacionados con tu motivo de consulta,
por favor tráelos. Esto nos ayuda a darte una mejor atención.

Pregunta: ¿Atienden emergencias?
Respuesta: No atendemos emergencias. En caso de urgencia médica,
por favor acude a la sala de emergencias más cercana o llama al 911.
```

### Palabras a Evitar

Define términos que el Agente IA no debe usar:

| Categoría                      | Ejemplos                                    |
| ------------------------------ | ------------------------------------------- |
| **Términos médicos complejos** | "Patología", "etiología", "cuadro clínico"  |
| **Palabras alarmantes**        | "Cáncer", "tumor", "grave"                  |
| **Jerga informal**             | "Onda", "chido", "vale"                     |
| **Promesas absolutas**         | "Te curará", "100% efectivo", "garantizado" |

---

## 🔔 Preferencias de Notificación

Controla qué información recibes y cómo.

### Notificaciones por Email

| Tipo                            | Descripción                      | Default        |
| ------------------------------- | -------------------------------- | -------------- |
| **Nuevas citas**                | Cuando un paciente agenda        | ✅ Activado    |
| **Citas canceladas**            | Cuando se cancela una cita       | ✅ Activado    |
| **Recordatorios de pacientes**  | Alertas de seguimiento           | ✅ Activado    |
| **Nuevos pacientes**            | Cuando alguien completa encuesta | ✅ Activado    |
| **Resumen semanal**             | Estadísticas de la semana        | ✅ Activado    |
| **Actualizaciones del sistema** | Nuevas funciones                 | ✅ Activado    |
| **Marketing y promociones**     | Ofertas especiales               | ❌ Desactivado |

### Notificaciones por WhatsApp

| Tipo                       | Descripción                  | Default     |
| -------------------------- | ---------------------------- | ----------- |
| **Alertas urgentes**       | Requieren atención inmediata | ✅ Activado |
| **Confirmaciones de cita** | Cuando apruebas/rechazas     | ✅ Activado |
| **Resumen diario**         | Citas del día siguiente      | ✅ Activado |

---

## 🕐 Horarios de Atención

Configura cuándo los pacientes pueden agendar citas y cuándo tu Agente IA debe responder.

### Estructura de Configuración

```
Configuración de Horarios
│
├── Horario Regular
│   ├── Lunes
│   ├── Martes
│   ├── Miércoles
│   ├── Jueves
│   ├── Viernes
│   ├── Sábado
│   └── Domingo
│
├── Excepciones
│   ├── Días específicos cerrado
│   ├── Horarios especiales
│   └── Vacaciones
│
└── Duración de Slots
    ├── Consulta general: 30 min
    ├── Primera visita: 45 min
    └── Procedimientos: Variable
```

### Ejemplo de Configuración

| Día       | Horario Mañana | Horario Tarde | Estado          |
| --------- | -------------- | ------------- | --------------- |
| Lunes     | 09:00 - 13:00  | 16:00 - 19:00 | 🟢 Activo       |
| Martes    | 09:00 - 13:00  | 16:00 - 19:00 | 🟢 Activo       |
| Miércoles | 09:00 - 13:00  | -             | 🟢 Activo       |
| Jueves    | 09:00 - 13:00  | 16:00 - 19:00 | 🟢 Activo       |
| Viernes   | 09:00 - 13:00  | 16:00 - 19:00 | 🟢 Activo       |
| Sábado    | 10:00 - 14:00  | -             | 🟡 Medio tiempo |
| Domingo   | -              | -             | 🔴 Cerrado      |

---

## 📂 Estructura del Menú

Navega fácilmente por todas las opciones de configuración:

```
⚙️ Configuración
│
├── 👤 Perfil
│   ├── Datos personales
│   ├── Foto de perfil
│   └── Especialidad y credenciales
│
├── 🔐 Seguridad
│   ├── Cambiar contraseña
│   ├── Sesiones activas
│   └── Verificación en dos pasos (próximamente)
│
├── 📱 WhatsApp
│   ├── Conectar número
│   ├── Configurar mensajes
│   └── Estado de conexión
│
├── 🤖 Agente IA
│   ├── Información del consultorio
│   ├── Tono de respuesta
│   ├── FAQ personalizada
│   └── Palabras prohibidas
│
├── 🔔 Notificaciones
│   ├── Preferencias de email
│   └── Preferencias de WhatsApp
│
├── 🕐 Horarios
│   ├── Horario regular
│   ├── Excepciones
│   └── Duración de citas
│
└── ⚠️ Cuenta
    ├── Exportar datos
    └── Eliminar cuenta
```

---

## ✅ Checklist de Configuración Inicial

Completa estos pasos para tener tu cuenta 100% operativa:

### Paso 1: Perfil Básico

- [ ] Verificar nombre de usuario
- [ ] Confirmar email
- [ ] Subir foto de perfil profesional
- [ ] Completar especialidad y cédula

### Paso 2: Conexión WhatsApp

- [ ] Conectar número de WhatsApp
- [ ] Verificar estado de conexión
- [ ] Probar envío de mensajes

### Paso 3: Configurar Agente IA

- [ ] Ingresar información del consultorio
- [ ] Seleccionar tono de respuesta
- [ ] Crear al menos 5 FAQs personalizadas
- [ ] Definir palabras a evitar
- [ ] Probar el Agente IA con preguntas de ejemplo

### Paso 4: Horarios y Disponibilidad

- [ ] Configurar horario regular de atención
- [ ] Definir duración de citas por tipo
- [ ] Agregar excepciones (vacaciones, días cerrados)

### Paso 5: Notificaciones

- [ ] Revisar preferencias de email
- [ ] Configurar alertas de WhatsApp
- [ ] Ajustar frecuencia de resúmenes

---

## ⚠️ Eliminación de Cuenta

Si decides dejar MediApp, te ofrecemos un proceso seguro de eliminación:

### Proceso de Eliminación

1. **Solicitud** - Inicias el proceso desde Configuración > Cuenta > Eliminar cuenta
2. **Confirmación** - Recibes un email con enlace de confirmación
3. **Período de gracia** - 30 días para revertir la decisión
4. **Eliminación definitiva** - Todos los datos se borran permanentemente

### Datos Afectados

| Tipo de dato               | Qué sucede                        |
| -------------------------- | --------------------------------- |
| **Perfil público**         | Se desactiva inmediatamente       |
| **Datos de pacientes**     | Eliminados tras período de gracia |
| **Historial de citas**     | Eliminados tras período de gracia |
| **Configuraciones**        | Eliminadas inmediatamente         |
| **Mensajes del Agente IA** | Eliminados tras período de gracia |

> ⚠️ **Importante:** Durante el período de gracia puedes reactivar tu cuenta iniciando sesión normalmente. Después de 30 días, la eliminación es irreversible.

---

## 💬 Beneficios para el Médico

> _"La configuración inicial toma solo 15 minutos, pero me ahorra horas cada semana. Mi Agente IA responde exactamente como yo lo haría, y los pacientes quedan impresionados con la atención inmediata."_
>
> **— Dra. Carmen Ruiz, Medicina General**

### Ventajas de una Configuración Completa

| Aspecto                      | Sin configurar | Con configuración óptima    |
| ---------------------------- | -------------- | --------------------------- |
| **Tiempo de respuesta**      | Horas o días   | Instantáneo 24/7            |
| **Calidad de información**   | Genérica       | Personalizada a tu práctica |
| **Experiencia del paciente** | Frustrante     | Fluida y profesional        |
| **Tasa de conversión**       | Baja           | Alta                        |
| **Tu carga de trabajo**      | Alta           | Reducida significativamente |

---

## 📝 Copy para Marketing

Frases listas para usar en redes sociales, emails y material promocional:

### Para Redes Sociales

> 🎯 "Tu consultorio, tu estilo. Configura tu Agente IA para que hable exactamente como tú lo harías. #MediApp #MedicinaDigital"

> 📱 "¿Sabías que puedes personalizar cada respuesta de tu Agente IA? Desde el tono hasta las palabras específicas de tu especialidad. #TecnologíaMédica"

> ⚙️ "15 minutos de configuración = Ahorro de horas cada semana. Así funciona MediApp. #ProductividadMédica"

### Para Email Marketing

**Asunto:** Configura tu consultorio virtual en minutos

> "Doctor/a [Nombre]:
>
> Imagina tener un asistente que conoce tu consultorio perfectamente: tus horarios, tus servicios, tu forma de hablar.
>
> En MediApp, la configuración es tan simple como completa. En solo unos minutos:
>
> ✅ Personalizas el tono de tu Agente IA
> ✅ Configuras tus horarios de atención
> ✅ Entrenas respuestas para preguntas frecuentes
> ✅ Conectas tu WhatsApp Business
>
> El resultado: Un consultorio virtual que trabaja 24/7 exactamente como tú lo harías.
>
> [Configurar mi cuenta ahora]"

### Para WhatsApp Business

> "🩺 ¡Hola! Soy tu Agente IA de MediApp.
>
> Estoy configurado para responder como el Dr./Dra. [Nombre]. Puedo ayudarte con:
> • Información sobre servicios y precios
> • Agendar tu cita
> • Responder preguntas frecuentes
> • Horarios de atención
>
> ¿En qué puedo ayudarte hoy?"

### Para Material Impreso (QR en consultorio)

> **"¿Preguntas? Tu Agente IA tiene respuestas"**
>
> Escanea para hablar con nuestro asistente virtual disponible 24/7
>
> [QR CODE]
>
> _Configurado con la información actualizada de nuestro consultorio_

---

## ❓ Preguntas Frecuentes

### Sobre el Perfil

**¿Puedo cambiar mi nombre de usuario después de crearlo?**

> Sí, pero debe seguir siendo único en la plataforma. Ten en cuenta que cambiar tu username también cambia tu URL pública.

**¿Qué pasa si olvido mi contraseña?**

> Puedes recuperarla desde la pantalla de inicio de sesión. Recibirás un enlace en tu email para restablecerla de forma segura.

### Sobre WhatsApp

**¿Necesito un número de WhatsApp Business específico?**

> No necesariamente. Puedes usar tu número personal, aunque recomendamos WhatsApp Business para funciones adicionales.

**¿Puedo desconectar WhatsApp temporalmente?**

> Sí, puedes pausar la conexión desde la configuración sin perder tus datos.

### Sobre el Agente IA

**¿El Agente IA puede dar diagnósticos médicos?**

> No. El Agente IA está diseñado para información general, agendamiento y preguntas administrativas. Nunca proporciona diagnósticos ni tratamientos.

**¿Cuántas FAQs puedo agregar?**

> Puedes agregar tantas como necesites. Recomendamos comenzar con las 10-15 preguntas más comunes y expandir desde ahí.

**¿Puedo cambiar el tono del Agente IA después?**

> Sí, puedes ajustar el tono en cualquier momento. Los cambios se aplican inmediatamente a todas las conversaciones nuevas.

### Sobre Horarios

**¿Los pacientes ven mis horarios reales?**

> Sí, tu página pública muestra disponibilidad basada en tu configuración de horarios.

**¿Qué pasa si necesito cerrar un día específico?**

> Puedes agregar excepciones en la configuración de horarios. El sistema bloqueará automáticamente esos días para agendamiento.

### Sobre la Cuenta

**¿Puedo exportar mis datos antes de eliminar la cuenta?**

> Sí, ofrecemos una opción de exportación completa de tu información antes de iniciar el proceso de eliminación.

**¿Hay algún costo por eliminar la cuenta?**

> No, la eliminación es gratuita. Solo ten en cuenta el período de gracia de 30 días.

---

## 📊 Métricas Clave

Mide el impacto de tu configuración:

| Métrica                       | Descripción                              | Meta Sugerida |
| ----------------------------- | ---------------------------------------- | ------------- |
| **Perfil completado**         | % de campos del perfil llenos            | 100%          |
| **Agente IA activo**          | Estado de configuración del IA           | ✅ Activo     |
| **FAQs configuradas**         | Número de preguntas personalizadas       | ≥ 10          |
| **WhatsApp conectado**        | Estado de la conexión                    | ✅ Conectado  |
| **Horarios definidos**        | Días de la semana configurados           | ≥ 5 días      |
| **Tasa de respuesta IA**      | % de consultas resueltas automáticamente | ≥ 70%         |
| **Tiempo de configuración**   | Minutos para setup inicial               | ≤ 20 min      |
| **Satisfacción del paciente** | Calificación promedio post-interacción   | ≥ 4.5/5       |

### Dashboard de Configuración

```
┌─────────────────────────────────────────┐
│     ESTADO DE CONFIGURACIÓN             │
├─────────────────────────────────────────┤
│                                         │
│  Perfil        ████████████ 100% ✅     │
│  WhatsApp      ████████████ 100% ✅     │
│  Agente IA     █████████░░░  80% ⚠️     │
│  Horarios      ████████████ 100% ✅     │
│  Notificaciones ████████░░░  75% ⚠️     │
│                                         │
│  Puntaje total: 91% ⭐⭐⭐⭐             │
│                                         │
│  [Ver detalles]  [Completar ahora]      │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎯 Próximos Pasos

Una vez que completes tu configuración:

1. **Visita tu página pública** - Ve cómo te ven los pacientes
2. **Prueba tu Agente IA** - Haz preguntas como si fueras paciente
3. **Comparte tu link** - Envíalo a pacientes existentes
4. **Revisa métricas** - Monitorea el rendimiento semanalmente
5. **Ajusta según feedback** - Mejora basado en interacciones reales

---

> **¿Necesitas ayuda con la configuración?** Nuestro equipo de soporte está disponible para guiarte paso a paso. Contáctanos desde tu dashboard o envía un email a soporte@mediapp.app
