# 📊 Dashboard

> Tu centro de comando profesional: métricas, acciones rápidas y control total de tu práctica médica

---

## ¿Qué es?

El **Dashboard** es el panel de control central de MediApp, diseñado para que los médicos tengan una visión completa y en tiempo real del rendimiento de su práctica médica digital.

Piensa en él como tu **centro de operaciones**: desde aquí monitoreas el impacto de tu página pública, gestionas tus citas, revisas el estado de tus campañas de mensajería y accedes rápidamente a todas las funcionalidades clave.

---

## Header de Bienvenida

Al ingresar, recibes una cálida bienvenida personalizada:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│   👋 ¡Buenos días, Dra. María!                              │
│                                                             │
│   🔔 3 notificaciones nuevas    ⚙️ Configuración  👤 Perfil │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Elementos del Header:**

| Elemento                  | Descripción                                   | Acción        |
| ------------------------- | --------------------------------------------- | ------------- |
| **Mensaje de Bienvenida** | Saludo personalizado con tu nombre            | Automático    |
| **Notificaciones**        | Alertas de nuevas citas, mensajes y actividad | Clic para ver |
| **Acceso Rápido**         | Enlaces a Configuración y Perfil              | 1 clic        |

---

## Métricas Principales (Tarjetas Superiores)

Las métricas más importantes de tu práctica, siempre visibles:

| Métrica                   | Descripción                                               | Icono |
| ------------------------- | --------------------------------------------------------- | ----- |
| **Visitas al Perfil**     | Número de visitantes a tu página pública (hoy/semana/mes) | 👁️    |
| **Encuestas Completadas** | Total de encuestas de salud finalizadas por pacientes     | 📝    |
| **Clicks en CTAs**        | Interacciones con botones de acción (WhatsApp, Agendar)   | 👆    |
| **Fuentes de Tráfico**    | Desglose de visitantes: QR vs Link Directo                | 📊    |

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  │    👁️        │ │     📝       │ │     👆       │ │     📊       │
│  │   1,247      │ │     89       │ │    234       │ │   QR: 60%    │
│  │  Visitas     │ │  Encuestas   │ │    Clicks    │ │ Directo: 40% │
│  │   este mes   │ │  completadas │ │   en CTAs    │ │              │
│  └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Widget de Citas y Reservas

Gestión completa de tu agenda médica:

### 📋 Solicitudes Pendientes

- Número de citas esperando tu aprobación
- Botones rápidos: **Aprobar** / **Rechazar**

### 📅 Citas de Hoy

- Lista de pacientes confirmados para el día
- Horarios y detalles de cada cita

### 📊 Estadísticas de Reservas

| Estado          | Descripción               |
| --------------- | ------------------------- |
| **Pendientes**  | Solicitudes por confirmar |
| **Aprobadas**   | Citas confirmadas         |
| **Rechazadas**  | Solicitudes declinadas    |
| **Completadas** | Citas finalizadas         |

### ⚡ Acciones Rápidas

- Ver agenda completa
- Configurar disponibilidad
- Gestionar solicitudes

```
┌─────────────────────────────────────────────────────────────┐
│  📅 CITAS Y RESERVAS                                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ⏳ Pendientes: 5    [Aprobar] [Rechazar]            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  📋 Hoy: 3 citas confirmadas                                │
│  ├─ 09:00 AM - Juan Pérez (Consulta General)               │
│  ├─ 11:30 AM - Ana López (Chequeo Anual)                   │
│  └─ 04:00 PM - Carlos Ruiz (Seguimiento)                   │
│                                                             │
│  📊 Estadísticas: 12 aprobadas | 3 pendientes | 45 total   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Widget de Pacientes

Gestión integral de tu base de pacientes:

### 👥 Estadísticas de Pacientes

| Categoría              | Descripción                     |
| ---------------------- | ------------------------------- |
| **Total de Pacientes** | Todos los pacientes registrados |
| **Consumidores**       | Pacientes activos con citas     |
| **Prospectos**         | Interesados sin cita aún        |
| **Afiliados**          | Pacientes recurrentes           |

### 🆕 Pacientes Recientes

- Últimos pacientes agregados a tu base
- Fecha de registro y etiqueta

### 🔄 Re-engagement

- Pacientes sin contacto en los últimos 30 días
- Sugerencias de campañas de recuperación

### ⚡ Acciones Rápidas

- Agregar nuevo paciente
- Ver lista completa
- Crear campaña de mensajes

```
┌─────────────────────────────────────────────────────────────┐
│  👥 PACIENTES                                               │
│                                                             │
│  Total: 156  |  Consumidores: 89  |  Prospectos: 45  |  Afiliados: 22
│                                                             │
│  🆕 Recientes:                                              │
│  ├─ María García - Registrado hoy                          │
│  ├─ Roberto Sánchez - Registrado ayer                      │
│  └─ Laura Martínez - Hace 2 días                           │
│                                                             │
│  🔄 Re-engagement: 12 pacientes sin contacto reciente      │
│     [Crear campaña de recuperación]                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Widget de Campañas y Mensajería

Control de tu comunicación con pacientes:

### 📈 Estadísticas de Mensajería

| Métrica               | Descripción                       |
| --------------------- | --------------------------------- |
| **Mensajes Enviados** | Total de mensajes este mes        |
| **Tasa de Entrega**   | Porcentaje de mensajes entregados |
| **Campañas Activas**  | Campañas en envío o programadas   |
| **Campañas Enviadas** | Campañas completadas              |

### 📨 Campañas Recientes

- Últimas 5 campañas con estado y métricas
- Estado: Borrador / Programada / Enviando / Completada

### 🤖 Sugerencias de IA

- Recomendaciones inteligentes para contactar pacientes
- Mejores momentos para enviar mensajes
- Segmentación sugerida

### ⚡ Acciones Rápidas

- Crear mensaje
- Ver campañas
- Gestionar clientes

```
┌─────────────────────────────────────────────────────────────┐
│  📨 CAMPAÑAS Y MENSAJERÍA                                   │
│                                                             │
│  📤 Enviados: 1,234  |  ✅ Entrega: 98%  |  🚀 Activas: 2   │
│                                                             │
│  📋 Campañas recientes:                                     │
│  ├─ 🟢 Campaña de Vacunación - Completada (95% apertura)   │
│  ├─ 🟡 Recordatorio Anual - Enviando (67% entregado)       │
│  └─ 🔴 Promoción Verano - Programada (mañana 9:00 AM)      │
│                                                             │
│  🤖 Sugerencia de IA:                                       │
│     "15 pacientes cumplen 6 meses sin visita.              │
│      ¿Crear campaña de chequeo preventivo?"                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Barra de Acciones Rápidas

Accesos directos a las funciones más usadas:

| Acción               | Descripción                             | Atajo  |
| -------------------- | --------------------------------------- | ------ |
| **Ver Perfil**       | Abre tu página pública en nueva pestaña | 1 clic |
| **Copiar Link**      | Copia tu URL al portapapeles            | 1 clic |
| **Descargar QR**     | Genera y descarga tu código QR          | 1 clic |
| **Editar Perfil**    | Abre el editor de perfil                | 1 clic |
| **Crear Campaña**    | Inicia el creador de campañas           | 1 clic |
| **Agregar Paciente** | Abre formulario de nuevo paciente       | 1 clic |

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ⚡ ACCIONES RÁPIDAS                                        │
│                                                             │
│  [👁️ Ver Perfil]  [🔗 Copiar Link]  [📱 Descargar QR]      │
│  [✏️ Editar Perfil]  [📨 Crear Campaña]  [➕ Agregar Paciente]
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Feed de Actividad Reciente

Historial de eventos importantes en tu práctica:

```
┌─────────────────────────────────────────────────────────────┐
│  🔔 ACTIVIDAD RECIENTE                                      │
│                                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  🆕 Nueva solicitud de cita - Juan Pérez                   │
│     Hace 5 minutos                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ✅ Encuesta completada - Ana López                        │
│     Hace 15 minutos                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  📨 Campaña "Vacunación" completada - 234 mensajes enviados│
│     Hace 1 hora                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  👤 Nuevo paciente registrado - María García               │
│     Hace 2 horas                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  👆 Click en WhatsApp desde tu perfil                      │
│     Hace 3 horas                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Tipos de actividad registrada:**

- 🆕 Nuevas solicitudes de reserva
- ✅ Encuestas completadas
- 📨 Campañas finalizadas
- 👤 Nuevos pacientes registrados
- 👆 Clicks en CTAs de tu perfil
- 📱 Escaneos de código QR

---

## Layout Visual del Dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  👋 ¡Buenos días, Dra. María!                    🔔  ⚙️  👤                │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │   👁️     │ │    📝    │ │    👆    │ │    📊    │                       │
│  │  1,247   │ │    89    │ │   234    │ │ QR: 60%  │                       │
│  │  Visitas │ │ Encuestas│ │  Clicks  │ │ Dir: 40% │                       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                       │
│                                                                             │
├───────────────────────────────┬─────────────────────────────────────────────┤
│                               │                                             │
│  📅 CITAS Y RESERVAS          │  👥 PACIENTES                               │
│                               │                                             │
│  ⏳ 5 pendientes              │  Total: 156 pacientes                       │
│  [Aprobar] [Rechazar]         │  Consumidores: 89 | Prospectos: 45         │
│                               │                                             │
│  📋 Hoy: 3 citas              │  🆕 Recientes:                              │
│  ├─ 09:00 Juan Pérez         │  ├─ María García (hoy)                     │
│  ├─ 11:30 Ana López          │  ├─ Roberto Sánchez (ayer)                 │
│  └─ 04:00 Carlos Ruiz        │  └─ Laura Martínez (hace 2 días)           │
│                               │                                             │
│  📊 12 aprobadas | 3 pendientes│  🔄 12 pacientes sin contacto              │
│                               │     [Crear campaña]                         │
│                               │                                             │
├───────────────────────────────┴─────────────────────────────────────────────┤
│                                                                             │
│  ⚡ ACCIONES RÁPIDAS                                                        │
│                                                                             │
│  [👁️ Ver] [🔗 Copiar] [📱 QR] [✏️ Editar] [📨 Campaña] [➕ Paciente]       │
│                                                                             │
├───────────────────────────────┬─────────────────────────────────────────────┤
│                               │                                             │
│  📨 CAMPAÑAS Y MENSAJERÍA     │  🔔 ACTIVIDAD RECIENTE                      │
│                               │                                             │
│  📤 1,234 enviados            │  🆕 Nueva cita - Juan Pérez                │
│  ✅ 98% entregados            │     Hace 5 minutos                          │
│  🚀 2 campañas activas        │  ─────────────────────────────────────      │
│                               │  ✅ Encuesta - Ana López                   │
│  📋 Recientes:                │     Hace 15 minutos                         │
│  🟢 Vacunación (95%)          │  ─────────────────────────────────────      │
│  🟡 Recordatorio (67%)        │  📨 Campaña completada                      │
│  🔴 Promoción (programada)    │     Hace 1 hora                             │
│                               │  ─────────────────────────────────────      │
│  🤖 Sugerencia de IA:         │  👤 Nuevo paciente - María García          │
│     "15 pacientes sin visita" │     Hace 2 horas                            │
│                               │                                             │
│                               │                                             │
└───────────────────────────────┴─────────────────────────────────────────────┘
```

---

## Beneficios para el Médico

> 🏆 **"Tu práctica médica, bajo control total"**
>
> El Dashboard te da la visibilidad que necesitas para tomar decisiones informadas. Desde una sola pantalla, conoces el estado de tu presencia digital, gestionas tus citas y mantienes el contacto con tus pacientes.

### Ventajas Clave:

- **📊 Visión Completa** — Todas tus métricas en un solo lugar
- **⏱️ Ahorro de Tiempo** — Accesos directos a funciones frecuentes
- **📈 Toma de Decisiones** — Datos reales para optimizar tu práctica
- **🔔 Alertas Inteligentes** — Notificaciones de lo que requiere atención
- **📱 Acceso 24/7** — Tu consultorio digital siempre disponible
- **🎯 Enfoque en Resultados** — Métricas que importan para tu negocio

---

## Copy para Marketing

### Frases Listas para Usar

**Para Redes Sociales:**

- "Tu práctica médica, bajo control total. Dashboard con métricas en tiempo real."
- "¿Sabes cuántos pacientes visitan tu perfil? Con nuestro Dashboard, sí."
- "Gestiona citas, pacientes y campañas desde una sola pantalla."
- "Datos que impulsan tu práctica: visitas, clicks, conversiones. Todo visible."

**Para Email Marketing:**

- "Toma el control de tu práctica médica con nuestro Dashboard integral. Métricas claras, acciones rápidas, resultados medibles."
- "Deja de adivinar. Nuestro Dashboard te muestra exactamente cómo está funcionando tu presencia digital."

**Para WhatsApp:**

- "¡Revisa tu Dashboard! Tienes 3 citas pendientes por confirmar y 5 nuevas visitas a tu perfil hoy."
- "Tu resumen semanal: 47 visitas al perfil, 12 encuestas completadas, 3 citas agendadas. ¡Sigue así!"

**Para Publicidad:**

- "Médicos: Conoce el impacto real de tu presencia digital. Dashboard con métricas que importan."
- "Gestiona tu práctica como un negocio. Datos claros, decisiones inteligentes, crecimiento constante."

---

## Opciones de Personalización

Adapta tu Dashboard a tus necesidades:

| Opción                       | Descripción                          |
| ---------------------------- | ------------------------------------ |
| **Ordenar Widgets**          | Arrastra y suelta para reorganizar   |
| **Mostrar/Ocultar**          | Activa solo los widgets que usas     |
| **Período de Métricas**      | Hoy, semana, mes o personalizado     |
| **Alertas Personalizadas** — | Configura qué notificaciones recibir |
| **Tema Visual**              | Claro, oscuro o automático           |

---

## Métricas Clave

| Métrica                   | Descripción                          | Importancia                  |
| ------------------------- | ------------------------------------ | ---------------------------- |
| **Visitas al Perfil**     | Tráfico a tu página pública          | 📊 Visibilidad de marca      |
| **Tasa de Conversión**    | Visitantes que toman acción          | 🎯 Efectividad del perfil    |
| **Encuestas Completadas** | Pacientes que llenaron el formulario | 📋 Calidad de leads          |
| **Clicks en CTAs**        | Interacciones con botones de acción  | 👆 Engagement                |
| **Fuentes de Tráfico**    | QR vs Link Directo                   | 📱 Canales de adquisición    |
| **Tiempo de Respuesta**   | Promedio de aprobación de citas      | ⏱️ Satisfacción del paciente |
| **Tasa de Entrega**       | Mensajes entregados vs enviados      | 📨 Eficacia de campañas      |
| **Pacientes Recurrentes** | Porcentaje de pacientes que regresan | 💰 Retención                 |

---

## Puntos de Entrada

Desde el Dashboard accedes directamente a:

- **🎨 Features y Funcionalidades** — Activa/desactiva módulos de tu perfil
- **⚙️ Configuración de Cuenta** — Ajustes de perfil, seguridad y notificaciones
- **📄 Página Pública** — Vista previa de tu perfil como lo ven los pacientes
- **📊 Reportes Detallados** — Análisis profundo de métricas

---

> 🚀 **Tu consultorio digital merece un centro de comando profesional. Con el Dashboard de MediApp, lo tienes.**
