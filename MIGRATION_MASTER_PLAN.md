# 🏥 Medical Chatbot Migration Master Plan

## 📋 Tabla de Contenidos

1. [Visión General](#visión-general)
2. [Fases de Migración](#fases-de-migración)
3. [Progreso](#progreso)
4. [Ejecución](#ejecución)
5. [Recursos](#recursos)

---

## 🎯 Visión General

Transformar el sistema **Wellness Link** (plataforma de tarjetas digitales de bienestar) en una **Plataforma de Configuración de Chatbot Médico** para profesionales de la salud.

### 🔄 Cambios Clave

- ❌ **Eliminar**: Google Calendar, BullMQ/Redis, wellness terminology
- ✅ **Agregar**: Sistema de reservas nativo, Inngest, terminología médica, flujos de aprobación

### 🎯 Objetivo Final

Doctores configuran en 15 minutos un asistente virtual en WhatsApp que:

- Cualifica leads de Meta Ads (Facebook/Instagram)
- Gestiona reservas con aprobación médica
- Envía recordatorios automáticos
- Reduce ausentismo en citas

---

## 📊 Fases de Migración

### 📋 FASE 1: Adaptación de Textos ✅

**Estado:** COMPLETADA  
**Duración:** 1-2 días  
**Carpeta:** `migrations/phase-01-text-adaptation/`

**✅ Completado:**

- [x] Cambiar "wellness" → "medical" en toda la UI
- [x] Actualizar plantillas de WhatsApp
- [x] Modificar labels de formularios
- [x] Actualizar contenido del dashboard
- [x] Traducir términos al español

**📁 Archivos:**

- `README.md` - Guía de la fase
- `ui-text-changes.md` - Cambios en interfaz
- `whatsapp-template-changes.md` - Plantillas WhatsApp
- `form-label-changes.md` - Labels de formularios
- `dashboard-content-changes.md` - Contenido dashboard
- `spanish-translation-changes.md` - Traducciones
- `phase-01-summary.md` - Resumen completo

---

### 🏗️ FASE 2: Infraestructura ✅

**Estado:** COMPLETADA
**Duración:** 2-3 días
**Carpeta:** `migrations/phase-02-infrastructure/`

**✅ Completado:**

- [x] Configurar Inngest (eliminar BullMQ/Redis)
- [x] Crear esquemas de base de datos
- [x] Diseñar arquitectura de servicios
- [x] Implementar repositorios médicos
- [x] Configurar eventos de Inngest
- [x] Crear funciones de workflow

**📁 Archivos creados:**

- `README.md` - Guía de la fase
- `inngest-setup.md` - Configuración Inngest
- `database-schemas.md` - Esquemas BD
- `service-architecture.md` - Arquitectura de servicios

**💻 Código implementado:**

- `packages/api/src/inngest/functions.ts` - 10 funciones de workflow
- `packages/api/src/inngest/index.ts` - Export de Inngest
- `packages/api/src/lib/inngest-client.ts` - Cliente Inngest
- `packages/api/src/types/inngest-events.ts` - Tipos de eventos
- `packages/api/src/services/business/approval.ts` - Servicio de aprobación
- `packages/api/src/services/business/notification.ts` - Servicio de notificaciones
- `packages/api/src/plugins/services.ts` - Servicios registrados en DI
- `packages/api/src/index.ts` - Serve endpoint de Inngest activo

**🔄 Pendientes:**

- Implementación de código de repositorios
- Funciones de Inngest completas
- Configuración de eventos

---

### 📧 FASE 3: Sistema de Solicitudes y Aprobaciones ✅

**Estado:** COMPLETADA  
**Duración:** 2-3 días  
**Carpeta:** `migrations/phase-03-request-approval/`

**✅ Completado:**

- [x] Implementar estados de slots (pending_approval, etc.)
- [x] Crear flujo solicitud → aprobación
- [x] Dashboard de solicitudes pendientes
- [x] Notificaciones al doctor vía WhatsApp
- [x] Sistema de expiración de solicitudes

**📁 Archivos completos:**

- `README.md` - Guía del sistema
- `slot-state-management.md` - Gestión de estados
- `request-workflow.md` - Flujo de solicitudes
- `doctor-dashboard.md` - Panel de doctor ✅
- `notification-system.md` - Sistema de notificaciones ✅

**💻 Código implementado:**

- `packages/api/src/index.ts` - reservationRoutes montadas
- `packages/api/src/api/routes/reservations.ts` - Endpoints de solicitudes
- `packages/api/src/services/business/reservation-request.ts` - Creación y eventos
- `packages/api/src/services/business/approval.ts` - Aprobación/rechazo y eventos
- `packages/api/src/services/business/notification.ts` - Notificaciones WhatsApp completas
- `packages/api/src/services/repository/profile.ts` - Método findById agregado
- `packages/api/src/inngest/functions.ts` - Workflow de expiración completo
- `packages/web/src/hooks/use-reservation-requests.ts` - Hooks React
- `packages/web/src/pages/dashboard/PendingRequestsPage.tsx` - Dashboard de doctor

---

### ✏️ FASE 4: Edición Pre-Confirmación 📋

**Estado:** PENDIENTE  
**Duración:** 1-2 días  
**Carpeta:** `migrations/phase-04-pre-confirmation-editing/`

**Objetivos:**

- [ ] Modal de edición para doctores
- [ ] Cambiar horario/servicio/duración
- [ ] Agregar notas y ajustar precio
- [ ] Aprobación con cambios
- [ ] Validación de cambios

**📁 Archivos necesarios:**

- `README.md` - Guía de edición
- `editing-modal.md` - Modal de edición
- `change-validation.md` - Validación de cambios
- `approval-with-changes.md` - Aprobación con cambios

---

### ⚡ FASE 5: Workflows de Inngest 📋

**Estado:** PENDIENTE  
**Duración:** 2-3 días  
**Carpeta:** `migrations/phase-05-ingest-workflows/`

**Objetivos:**

- [ ] Recordatorios automáticos (24h, 2h)
- [ ] Confirmaciones de cambios
- [ ] Cancelaciones y reprogramaciones
- [ ] Generación diaria de slots
- [ ] Manejo de expiraciones

**📁 Archivos necesarios:**

- `README.md` - Guía de workflows
- `reminder-workflows.md` - Recordatorios
- `cancellation-workflows.md` - Cancelaciones
- `slot-generation-workflow.md` - Generación de slots
- `expiration-handling.md` - Manejo de expiraciones

---

### 🎨 FASE 6: UI de Reservas 📋

**Estado:** PENDIENTE  
**Duración:** 3-4 días  
**Carpeta:** `migrations/phase-06-reservation-ui/`

**Objetivos:**

- [ ] Catálogo de servicios médicos
- [ ] Configurador de disponibilidad
- [ ] Calendario de reservas interactivo
- [ ] Panel de gestión para doctores
- [ ] Vista de solicitudes pendientes

**📁 Archivos necesarios:**

- `README.md` - Guía de UI
- `service-catalog-component.md` - Catálogo de servicios
- `availability-configurator.md` - Configurador de disponibilidad
- `reservation-calendar.md` - Calendario de reservas
- `doctor-management-panel.md` - Panel de gestión

---

### 🧪 FASE 7: Integración y Testing 📋

**Estado:** PENDIENTE  
**Duración:** 2-3 días  
**Carpeta:** `migrations/phase-07-integration-testing/`

**Objetivos:**

- [ ] Migración de datos existentes
- [ ] Testing de workflows completos
- [ ] Optimización de performance
- [ ] Documentación final
- [ ] Deployment guide

**📁 Archivos necesarios:**

- `README.md` - Guía de integración
- `data-migration.md` - Migración de datos
- `workflow-testing.md` - Testing de workflows
- `performance-optimization.md` - Optimización
- `deployment-guide.md` - Guía de deployment

---

## 📈 Progreso General

| Fase                | Estado         | Progreso | Archivos     | Estado Archivos              |
| ------------------- | -------------- | -------- | ------------ | ---------------------------- |
| 1 - Textos          | ✅ COMPLETADA  | 100%     | 6 archivos   | ✅ Completados               |
| 2 - Infraestructura | ✅ COMPLETADA | 100%      | 6/6 archivos | ✅ 6 completos, 0 pendientes |
| 3 - Solicitudes     | ✅ COMPLETADA  | 100%     | 5/5 archivos | ✅ 5 completos, 0 pendientes |
| 4 - Edición         | 📋 PENDIENTE   | 0%       | 0/4 archivos | ⏳ 4 pendientes              |
| 5 - Workflows       | 📋 PENDIENTE   | 0%       | 0/5 archivos | ⏳ 5 pendientes              |
| 6 - UI              | 📋 PENDIENTE   | 0%       | 0/5 archivos | ⏳ 5 pendientes              |
| 7 - Testing         | 📋 PENDIENTE   | 0%       | 0/5 archivos | ⏳ 5 pendientes              |

**Total:** 18 archivos completados de 37 archivos planeados (49%)

---

## 🚀 Cómo Ejecutar la Migración

### Paso 1: Revisar este documento

📖 **Lee completamente** este plan maestro para entender el alcance total

### Paso 2: Ejecutar fases en orden

1. **Fase 1** → **Fase 2** → **Fase 3** → etc.
2. **No saltar fases** - cada una depende de la anterior
3. **Marcar progreso** en este documento

### Paso 3: Para cada fase

```bash
# 1. Leer README de la fase
cat migrations/phase-X/README.md

# 2. Ejecutar archivos en orden
# 3. Marcar como completada aquí
# 4. Pasar a siguiente fase
```

---

## ✅ Checklist de Progreso

### Pre-requisitos

- [x] Estructura de carpetas creada
- [x] Documento maestro creado
- [ ] Todas las fases completadas
- [ ] Testing final ejecutado
- [ ] Documentación actualizada

### Fase 1 - Textos

- [x] UI text changes documentado
- [x] WhatsApp templates actualizados
- [x] Form labels modificados
- [x] Dashboard content cambiado
- [x] Spanish translations completadas

### Fase 2 - Infraestructura

- [x] Inngest setup documentado
- [x] Database schemas definidos
- [x] Service architecture planeado
- [x] Código de repositorios implementado
- [x] Eventos de Inngest configurados
- [x] Funciones de workflow creadas

### Fase 3 - Solicitudes

- [x] Estados de slots implementados
- [x] Flujo solicitud → aprobación
- [x] Dashboard de solicitudes pendientes creado
- [x] Notificaciones al doctor vía WhatsApp
- [x] Sistema de expiración de solicitudes (30 min)

---

## 📚 Recursos Adicionales

### 📁 Estructura de Carpetas

```
migrations/
├── phase-01-text-adaptation/          ✅ COMPLETADA
│   ├── README.md
│   ├── ui-text-changes.md
│   ├── whatsapp-template-changes.md
│   ├── form-label-changes.md
│   ├── dashboard-content-changes.md
│   ├── spanish-translation-changes.md
│   └── phase-01-summary.md
├── phase-02-infrastructure/           ✅ COMPLETADA
│   ├── README.md
│   ├── inngest-setup.md
│   ├── database-schemas.md
│   └── service-architecture.md
├── phase-03-request-approval/         ✅ COMPLETADA
│   ├── README.md
│   ├── slot-state-management.md
│   ├── request-workflow.md
│   ├── doctor-dashboard.md
│   └── notification-system.md
├── phase-04-pre-confirmation-editing/ 📋 PENDIENTE
├── phase-05-ingest-workflows/         📋 PENDIENTE
├── phase-06-reservation-ui/           📋 PENDIENTE
└── phase-07-integration-testing/      📋 PENDIENTE
```

### 🔗 Enlaces Útiles

- [Documento PRD Original](./docs/global-prd.md)
- [Estructura de Carpetas](./migrations/)
- [Repositorio Wellness Link](https://github.com/wellness-link)

---

## 📞 Soporte

Para dudas sobre la migración:

1. **Revisar este documento primero**
2. **Leer el README de la fase específica**
3. **Consultar los archivos de la fase**
4. **Ejecutar paso a paso**

---

**📅 Última actualización:** Enero 2025
**📊 Estado:** 49% completo (18/37 archivos)
**🎯 Próxima fase:** FASE 4 - Edición Pre-Confirmación
