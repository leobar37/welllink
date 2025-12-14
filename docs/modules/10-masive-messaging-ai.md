# Module 10 — Mensajería Masiva con IA + Envío por WhatsApp

## Visión General
Este módulo transforma Wellness Link en un **asesor inteligente** que ayuda a los vendedores de Herbalife a generar mensajes efectivos con IA y enviarlos de forma masiva vía WhatsApp a su base de clientes. Combina automatización inteligente con comunicación personalizada para maximizar el engagement y las ventas.

## Objetivos del Módulo

### Objetivo Principal
Empoderar a los vendedores de Herbalife con un asistente de IA que:
- Genera mensajes persuasivos y personalizados automáticamente
- Gestiona campañas masivas de WhatsApp de forma inteligente
- Aprende de las preferencias del usuario para mejorar continuamente
- Gestiona la comunicación de forma responsable

### Objetivos Secundarios
- **Ahorro de Tiempo**: Reducir de 30 minutos a 2 minutos la creación de mensajes
- **Personalización**: Mensajes específicos por tipo de cliente (consumidor, prospecto, afiliado)
- **Escalabilidad**: Enviar a cientos de clientes con un solo clic
- **Inteligencia**: IA que aprende y mejora basándose en el historial del usuario

## Alcance MVP

### Fase 1 - Funcionalidad Básica ✅
- [x] Generador de mensajes con IA
- [x] Registro simple de clientes
- [x] Envío individual de mensajes
- [x] Lista básica de contactos

### Fase 2 - Masivo y Analítica (Implementación Actual)
- [ ] **Generador de Mensajes con IA Avanzado**
  - Selección de objetivo del mensaje
  - Selección de tono (motivacional, informativo, persuasivo, etc.)
  - Campo para detalles adicionales
  - Múltiples variaciones del mensaje generado
  - **Configuración de Personalización para Asesores**: perfil motivacional propio (frases frecuentes, estilo de comunicación, enfoque emocional, líneas guía)

- [ ] **Sistema de Gestión de Clientes Completo**
  - Registro de clientes con datos básicos (nombre, teléfono, email)
  - Edición y actualización de información
  - **Sistema de notas por cliente**: notas personales por contacto (ej: "prefiere mensajes de mañana", "está interesado pero espera quincena", "le gusta productos para energía")
  - **Labels por cliente**:
    - **Consumidor**: ya consume los productos
    - **Prospecto**: recién contactado
    - **Afiliado**: forma parte de la red de referidos

- [ ] **Selección de Audiencia Inteligente**
  - Selección manual: todos, clientes activos, prospects, segmentos personalizados
  - **Sugerencias del Asesor (IA)**: recomendaciones basadas en:
    - Tiempo sin contacto
    - Compras recientes o falta de seguimiento
    - Comentarios agregados
    - Etiqueta del cliente
  - Ejemplos: "Te conviene escribirle hoy a X", "Este prospecto no recibe seguimiento hace 7 días"

- [ ] **Envío Masivo por WhatsApp**
  - Vista previa antes del envío
  - Confirmación con conteo de destinatarios
  - Envío asíncrono con cola de procesamiento
  - Estado de envío por contacto (pendiente, enviado, entregado, fallido)
  - Rate limiting (50 mensajes/minuto)

- [ ] **Historial y Analítica de Campañas**
  - Lista de campañas con fechas
  - Cantidad de mensajes enviados
  - Mensaje usado en cada campaña
  - Resultados básicos (enviados, entregados, fallidos)
  - Filtros por fecha, estado, objetivo

### Fase 3 - Pro (Futuro)
- [ ] Segmentación avanzada con múltiples criterios
- [ ] Plantillas guardadas y favoritas
- [ ] Auto-respuestas inteligentes
- [ ] Analítica avanzada (tasas de respuesta, engagement)
- [ ] Programación de mensajes
- [ ] Integración con CRM externo

## Funcionalidades Principales

### 1. Generador de Mensajes con IA

#### Características
- **Objetivos Predefinidos**:
  - Seguimiento post-consulta
  - Promoción de productos
  - Bienvenida a nuevos clientes
  - Recordatorio de cita
  - Motivación y apoyo
  - Seguimiento post-compra

- **Tonos Disponibles**:
  - Motivacional: "¡Estás en el camino correcto!"
  - Informativo: Datos claros y precisos
  - Persuasivo: Enfocado en beneficios
  - Amigable: Cercano y cálido
  - Profesional: Formal pero accesible

- **Configuración de Personalización**:
  - Frases frecuentes del asesor
  - Estilo de comunicación preferido
  - Enfoque emocional (alto, medio, bajo)
  - Líneas guía personales
  - Palabras clave a evitar/incluir

#### Flujo de Usuario
1. Acceder a "Crear Mensaje" desde dashboard
2. Seleccionar objetivo del mensaje
3. Seleccionar tono
4. (Opcional) Agregar detalles adicionales
5. (Opcional) Seleccionar cliente específico para personalización
6. Hacer clic en "Generar con IA"
7. Revisar mensaje generado
8. (Opcional) Regenerar o solicitar variaciones
9. Guardar como plantilla o usar directamente

### 2. Gestión de Clientes

#### Registro de Clientes
- **Formulario de Registro**:
  - Nombre completo (requerido)
  - Teléfono con código de país (requerido)
  - Email (opcional)
  - Label inicial (consumidor, prospecto, afiliado)
  - Notas iniciales

- **Lista de Clientes**:
  - Vista de tabla con todos los clientes
  - Filtros por label, fecha de creación
  - Búsqueda por nombre o teléfono
  - Paginación
  - Acciones: ver, editar, eliminar, enviar mensaje

#### Sistema de Notas
- **Agregar Nota**:
  - Texto libre
  - Fecha automática
  - Visible solo para el propietario (asesor)

- **Ejemplos de Notas Útiles**:
  - "Prefiere mensajes en la mañana"
  - "Interesado en productos para pérdida de peso"
  - "Está evaluando, le interesa pero espera quincena"
  - "Alérgico a X producto"
  - "Celebró su cumpleaños ayer"
  - "Le gustan los productos naturales"

- **Uso en IA**: Las notas alimentan la memoria del sistema y ayudan a generar mensajes más personalizados

### 3. Selección de Audiencia

#### Opciones de Selección
1. **Manual**:
   - Todos los clientes
   - Por label (consumidores, prospects, afiliados)
   - Clientes activos
   - Segmentos personalizados

2. **Inteligente (IA)**:
   - "Clientes sin contacto en X días"
   - "Prospects listos para seguimiento"
   - "Consumidores para recompra"
   - "Afiliados para motivación"
   - "Clientes que tienen notas sobre X"

#### Sugerencias del Asesor (IA)
El sistema analiza:
- **Tiempo sin contacto**: "3 prospects no reciben seguimiento hace 7 días"
- **Notas**: "5 clientes tienen notas sobre productos para energía"
- **Estacionalidad**: "Es buen momento para promover productos de temporada"
- **Etiquetas**: "Prospectos listos para seguimiento"

### 4. Envío Masivo por WhatsApp

#### Flujo de Envío
1. **Preparación**:
   - Mensaje ya generado con IA
   - Audiencia seleccionada
   - Vista previa del mensaje
   - Conteo de destinatarios

2. **Confirmación**:
   - Mostrar resumen: "Se enviará a 45 clientes"
   - Opción de modificar audiencia
   - Botón "Enviar Campaña"

3. **Procesamiento**:
   - Envío asíncrono (cola de procesamiento)
   - Barra de progreso en tiempo real
   - Posibilidad de pausar/cancelar

4. **Estado por Contacto**:
   - ✅ Enviado
   - ✅ Entregado
   - ❌ Fallido (con motivo del error)

#### Características Técnicas
- Rate limiting: 50 mensajes/minuto por advisor
- Reintentos automáticos: 3 intentos para mensajes fallidos
- Tiempo máximo de envío: 2 minutos para 100 mensajes
- Notificación al completar: "Campaña enviada a 45/45 destinatarios"

### 5. Historial de Campañas

#### Lista de Campañas
**Columnas**:
- Fecha y hora
- Nombre de campaña
- Objetivo
- Destinatarios (cantidad)
- Estado (borrador, programada, enviada, fallida)
- Acciones (ver detalles, reenviar, duplicar)

#### Detalle de Campaña
- Mensaje completo enviado
- Estadísticas: enviados, entregados, fallidos
- Lista de destinatarios con estado individual
- Gráfico de barras (enviados vs entregados)

#### Filtros
- Por fecha (últimos 7, 30, 90 días)
- Por estado
- Por objetivo
- Por label de audiencia

## Experiencia de Usuario (UX)

### Flujo Ideal Completo
1. **Crear Mensaje con IA** (2 minutos)
   - Objetivo → Tono → Detalles → Generar → Revisar

2. **Seleccionar Audiencia** (1 minuto)
   - Elegir tipo → Refinar con IA → Vista previa de lista

3. **Vista Previa y Confirmación** (30 segundos)
   - Ver mensaje final → Ver destinatarios → Confirmar envío

4. **Enviar** (automático)
   - Procesamiento en cola → Envío asíncrono → Notificación

5. **Ver Resultados** (30 segundos)
   - Estadísticas → Detalles por contacto → Guardar como plantilla

**Tiempo Total: ~4 minutos vs 30 minutos manual**

### Pantallas Principales

#### Dashboard Principal
```
┌─────────────────────────────────────────────┐
│  📱 Mensajería Masiva con IA                │
├─────────────────────────────────────────────┤
│  [✨ Crear Mensaje]  [📊 Ver Campañas]      │
│                                             │
│  Sugerencias de IA:                         │
│  • 5 prospects sin seguimiento (7 días)     │
│  • 3 consumidores → recompra                │
│  • 12 afiliados para motivación             │
│                                             │
│  Últimas Campañas:                          │
│  • Promoción navidad - 45 enviados ✅       │
│  • Seguimiento Q4 - 23 enviados ✅          │
└─────────────────────────────────────────────┘
```

#### Crear Mensaje
```
┌─────────────────────────────────────────────┐
│  Generar Mensaje con IA                     │
├─────────────────────────────────────────────┤
│  Objetivo: [Seguimiento ▼]                  │
│  Tono:     [Motivacional ▼]                 │
│                                             │
│  Detalles adicionales (opcional):           │
│  ┌─────────────────────────────────────────┐ │
│  │ Promocionar producto X para fin de año  │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  [✨ Generar con IA]                        │
│                                             │
│  Mensaje Generado:                          │
│  ┌─────────────────────────────────────────┐ │
│  │ ¡Hola! 👋 ¿Cómo vas con tu wellness?    │ │
│  │                                         │ │
│  │ Te tengo algo especial parafin de año:  │ │
│  │ 🎁 Producto X con descuento especial    │ │
│  │                                         │ │
│  │ ¿Te interesa conocer más detalles?      │ │
│  └─────────────────────────────────────────┘ │
│                                             │
│  [🔄 Regenerar]  [✓ Usar este mensaje]      │
└─────────────────────────────────────────────┘
```

#### Seleccionar Audiencia
```
┌─────────────────────────────────────────────┐
│  Seleccionar Audiencia                      │
├─────────────────────────────────────────────┤
│  Mensaje: "Seguamiento motivacional"        │
│                                             │
│  Seleccionar por:                           │
│  ○ Todos los clientes (156)                 │
│  ○ Solo prospects (45)                      │
│  ○ Solo consumidores (89)                   │
│  ○ Solo afiliados (22)                      │
│  ○ Selección inteligente (IA)               │
│                                             │
│  [Siguiente: Vista Previa →]                │
└─────────────────────────────────────────────┘
```

## Arquitectura Técnica

### Dependencias
- **Module 01 (Auth)**: Autenticación de usuarios
- **Module 09 (WhatsApp)**: Infraestructura base de WhatsApp
- **Module 06 (Dashboard)**: Interfaz de usuario
- **Module 04 (Features)**: Activación/desactivación de módulo

### Stack Tecnológico
- **Backend**: Bun + Elysia + Drizzle ORM
- **Base de Datos**: PostgreSQL
- **Cola de Mensajes**: BullMQ + Redis
- **IA**: OpenAI GPT-4
- **WhatsApp**: Evolution API (módulo existente)

### Integraciones
- **OpenAI API**: Generación de mensajes
- **Evolution API**: Envío de mensajes WhatsApp
- **Redis**: Colas y caché
- **PostgreSQL**: Almacenamiento persistente

## Reglas de Negocio

### Compliance y Ética
1. **Solo enviar a contactos con permiso**:
   - Verificar opt-in antes de cada envío
   - Incluir opción de baja en cada mensaje
   - Procesar bajas inmediatamente

2. **Evitar mensajes médicos**:
   - Filtrar contenido generado por IA
   - Palabras prohibidas: "cura", "trata", "diagnostica"
   - Revisión automática antes del envío

3. **Dividir envíos grandes**:
   - Máximo 100 mensajes por batch
   - Rate limiting: 50 mensajes/minuto
   - Pausa automática entre batches

### Personalización
- Usar nombre del cliente cuando esté disponible
- Respetar comentarios del cliente ("prefiere mensajes de mañana")
- Adaptar tono según label (más técnico para afiliados, más motivacional para prospects)

### Seguridad
- Datos de clientes encriptados en reposo
- Rate limiting por usuario (evitar spam)
- Audit log de todas las acciones
- Validación de números de teléfono

## Métricas de Éxito

### KPIs Principales
1. **Mensajes Enviados**: Total de mensajes enviados por mes
2. **Campañas Creadas**: Número de campañas por usuario/semana
3. **Tasa de Entrega**: % de mensajes entregados exitosamente
4. **Clientes Registrados**: Nuevos clientes por mes
5. **Tiempo de Creación**: Minutos promedio para crear y enviar mensaje

### KPIs Secundarios
- **Adopción del Módulo**: % de usuarios activos usando el módulo
- **Uso de IA**: % de mensajes generados con IA vs manuales
- **Tasa de Respuesta**: % de clientes que responden
- **Conversión**: % de mensajes que resultan en venta/seguimiento

### Dashboard de Métricas
```
┌─────────────────────────────────────────────┐
│  Métricas de Mensajería (Últimos 30 días)   │
├─────────────────────────────────────────────┤
│  📊 1,234 mensajes enviados                 │
│  📧 23 campañas creadas                     │
│  ✅ 96% tasa de entrega                     │
│  👥 45 nuevos clientes                      │
│  ⏱️ 2.3 min promedio creación               │
│                                             │
│  [Ver reporte completo]                     │
└─────────────────────────────────────────────┘
```

## Roadmap de Implementación

### Sprint 1 (2 semanas)
- [ ] Diseño de base de datos (tablas: client, campaign, etc.)
- [ ] API endpoints básicos para clientes
- [ ] CRUD de clientes en frontend
- [ ] Integración OpenAI para generación de mensajes

### Sprint 2 (2 semanas)
- [ ] Sistema de labels y comentarios
- [ ] Generación de mensajes con personalización
- [ ] Selección de audiencia básica
- [ ] Envío masivo con cola BullMQ

### Sprint 3 (2 semanas)
- [ ] Historial de campañas
- [ ] Analytics básicos
- [ ] Sugerencias de IA para audiencia

### Sprint 4 (2 semanas)
- [ ] Optimizaciones de performance
- [ ] Testing y QA
- [ ] Documentación y training

## Casos de Uso Detallados

### Caso 1: Promoción de Producto
**Usuario**: María, vendedora Herbalife
**Situación**: Tiene nuevo producto para pérdida de peso
**Flujo**:
1. Va a "Crear Mensaje"
2. Selecciona objetivo: "Promoción de productos"
3. Tono: "Persuasivo"
4. Detalles: "Producto X, 20% descuento fin de mes"
5. IA genera 3 variaciones
6. Selecciona audiencia: "Consumidores (89 clientes)"
7. Vista previa: ve mensaje y lista de destinatarios
8. Confirma envío
9. 45 mensajes enviados en 2 minutos
10. Recibe notificación: "Campaña enviada a 89/89 destinatarios"

### Caso 2: Seguimiento Inteligente
**Usuario**: Carlos, vendedor experimentado
**Situación**: Quiere hacer seguimiento post-navidad
**Flujo**:
1. Accede al dashboard
2. Ve sugerencia IA: "3 prospects sin seguimiento (7 días)"
3. Hace clic en sugerencia
4. IA automáticamente genera mensaje de seguimiento
5. Revisa, modifica ligeramente
6. Envía a 3 prospects específicos
7. Al día siguiente, 2 responden con interés

## Riesgos y Mitigaciones

### Riesgo 1: Mensajes de IA no apropiados
**Mitigación**:
- Palabras prohibidas en prompts
- Revisión automática de contenido
- Opción de revisar antes de enviar
- Reporte y ajuste de prompts

### Riesgo 2: Bloqueo de WhatsApp por spam
**Mitigación**:
- Rate limiting estricto
- Solo enviar a clientes registrados
- Contenido de calidad (IA mejora esto)
- Monitoreo de tasa de entrega

### Riesgo 3: Costos altos de OpenAI
**Mitigación**:
- Caché de mensajes generados
- Límite de tokens por usuario/mes
- Modelos optimizados para costo
- Métricas de uso en dashboard

### Riesgo 4: Baja adopción del módulo
**Mitigación**:
- Onboarding guiado
- Plantillas predefinidas
- Tutoriales en video
- Soporte proactivo

## FAQ para Usuarios

**P: ¿Puedo editar los mensajes generados por IA?**
R: Sí, totalmente. Puedes modificar cualquier mensaje antes de enviarlo.

**P: ¿La IA aprende de mis mensajes anteriores?**
R: Sí, el sistema guarda tus preferencias y estilo para mejorar las sugerencias.

**P: ¿Qué pasa si un cliente no recibe el mensaje?**
R: El sistema reintenta automáticamente 3 veces. Si falla, se marca como "fallido" y puedes reenviar manualmente.

**P: ¿Puedo programar envíos para más tarde?**
R: En Fase 3 (Pro) podrás programar mensajes para envío futuro.

## Conclusión

El Módulo 10 transforma Wellness Link en una plataforma inteligente de comunicación que combina lo mejor de la automatización (IA, envíos masivos) con lo mejor del toque humano (personalización, comentarios, estilo propio). Permite a los vendedores de Herbalife escalar su comunicación sin perder la calidez y personalización que caracteriza a su negocio.
