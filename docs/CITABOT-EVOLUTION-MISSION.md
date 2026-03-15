# CitaBot Evolution - Mission Factory

> **Fecha:** 7 de Marzo, 2026  
> **Proyecto:** CitaBot  
> **Estado:** Pendiente de ejecución por Droid

---

## Objetivo Principal

Transformar **CitaBot** de una plataforma de agendamiento para negocios de belleza en una **plataforma SaaS multi-industria** con sistema completo de **gestión de inventario** y **motor de automatizaciones**, manteniendo backwards compatibility con usuarios existentes.

**Industrias objetivo:** Spas, Peluquerías, Barberías, Salones de uñas, Gimnasios, Consultores, Talleres técnicos, y cualquier negocio de servicios con citas.

---

## Contexto Actual del Proyecto

### Stack Tecnológico (mantener)

| Capa     | Tecnología                                                 |
| -------- | ---------------------------------------------------------- |
| Backend  | Bun + Elysia + Drizzle ORM + PostgreSQL + Inngest          |
| Frontend | React 19 + Vite + React Router 7 + Tailwind v4 + shadcn/ui |
| Auth     | Better Auth                                                |
| Jobs     | Inngest                                                    |
| WhatsApp | Evolution API                                              |
| AI       | Vercel AI SDK / VoltAgent                                  |

### Branding Actual

- **Nombre:** CitaBot
- **Logo:** Componente `LogoCitaBot` en `packages/web/src/components/ui/logo-citabot.tsx`
- **Tema:** Morado/Violeta Tech (defecto), con temas adicionales

### Arquitectura Existente

- Patrón Repository/Business/Infrastructure en `packages/api/src/services/`
- Esquemas Drizzle en `packages/api/src/db/schema/`
- Background jobs en `packages/api/src/inngest/functions/`
- Features organizadas por rutas en `packages/web/src/routes/`

---

## Alcance de la Misión

### 1. Sistema de Inventario Multi-dimensional

- Productos con categorías, SKUs, precios, stock
- Gestión de proveedores y órdenes de compra
- Movimientos de stock (entradas, salidas, ajustes, transferencias)
- Alertas de stock bajo y vencimientos
- Consumo automático de inventario por servicios

### 2. Motor de Automatizaciones

- Triggers: Eventos del sistema, tiempo, comportamiento
- Acciones: WhatsApp, email, actualizar registros, crear tareas
- Builder visual tipo Zapier
- Plantillas por industria
- Scheduling con Inngest

### 3. Multi-Business Adaptation

- Tipos de negocio configurables (belleza, salud, fitness, servicios profesionales)
- Campos personalizados por industria
- Gestión de staff/empleados
- Servicios adaptados (con recursos, consumo de inventario)

### 4. Integración con Sistemas Existentes

- Inventario ↔ Servicios (consumo por cita)
- Automatizaciones ↔ WhatsApp (ya existe Evolution API)
- Automatizaciones ↔ Citas y CRM
- Agente IA con conocimiento de inventario

---

## Plan de Milestones

> **NOTA:** Droid debe usar el skill **leon** para orquestar:
>
> - `fullstack-backend` → Database, repositories, API
> - `fullstack-inngest` → Background jobs, automations, WhatsApp
> - `fullstack-auth-better` → Multi-tenancy, roles
> - `frontend` → UI components, forms, tables

---

### MILESTONE 1: Inventory Foundation

_Schema, API y UI base para inventario_

#### 1.1 Database Schema - Inventory Tables

- **Skill:** `fullstack-backend`
- **Tareas:**
  - Crear tablas: `product`, `inventory_item`, `stock_movement`, `supplier`, `product_category`
  - Relaciones: product ↔ service, product ↔ supplier
  - Campos: sku, name, description, price, cost, unit, min_stock, expiration_date, location
- **Validación:** Migraciones Drizzle ejecutan sin errores

#### 1.2 Repository & Business Layer

- **Skill:** `fullstack-backend`
- **Tareas:**
  - Repository: `product.repository.ts`, `inventory.repository.ts`, `supplier.repository.ts`
  - Business: `product.service.ts`, `inventory.service.ts`
  - Métodos: CRUD, search, stock operations, low stock alerts
  - Registrar en `src/plugins/services.ts`
- **Validación:** Tests unitarios pasan

#### 1.3 API Endpoints - Inventory

- **Skill:** `fullstack-backend`
- **Tareas:**
  - Rutas: `GET/POST/PUT/DELETE /api/inventory/products`
  - Endpoints de stock: `POST /api/inventory/adjust`, `POST /api/inventory/movement`
- **Validación:** Tests de integración pasan

#### 1.4 Frontend - Inventory Dashboard

- **Skill:** `frontend`
- **Tareas:**
  - Crear feature `inventory/` en frontend
  - Vista de lista: DataTable con filtros
  - Formularios: Crear/editar producto, ajuste de stock
- **Validación:** UI funcional y responsive

---

### MILESTONE 2: Supplier & Purchase Orders

_Gestión de proveedores y órdenes de compra_

#### 2.1 Supplier Management

- **Skill:** `fullstack-backend` + `frontend`
- **Tareas:**
  - Schema: Tabla `supplier` (name, contact, phone, email, address)
  - API: CRUD de proveedores
  - UI: Lista, formulario, asignación a productos
- **Validación:** Proveedores vinculados correctamente

#### 2.2 Purchase Orders

- **Skill:** `fullstack-backend` + `fullstack-inngest`
- **Tareas:**
  - Schema: `purchase_order`, `purchase_order_item`
  - Flujo: Crear orden → Recibir stock
  - UI: Lista de órdenes, formulario de recepción
- **Validación:** Al recibir orden, stock se actualiza automáticamente

---

### MILESTONE 3: Inventory Integration with Services

_Vincular inventario con servicios y citas_

#### 3.1 Service-Product Link

- **Skill:** `fullstack-backend`
- **Tareas:**
  - Tabla `service_product` (servicio ↔ producto + cantidad requerida)
  - Modificar schema de servicios para soportar consumo de inventario
- **Validación:** Servicios muestran productos requeridos

#### 3.2 Automatic Stock Deduction

- **Skill:** `fullstack-inngest` + `fullstack-backend`
- **Tareas:**
  - Trigger: Cita completada
  - Job: Deducir stock de productos del servicio
  - Validar stock suficiente antes de confirmar cita
- **Validación:** Al completar cita, stock se reduce automáticamente

#### 3.3 Low Stock Alerts

- **Skill:** `fullstack-inngest`
- **Tareas:**
  - Cron job diario: Revisar productos bajo mínimo
  - Enviar notificación (WhatsApp/email) con lista de productos críticos
- **Validación:** Alertas se envían correctamente

---

### MILESTONE 4: Automation Engine Core

_Motor de automatizaciones con triggers y acciones_

#### 4.1 Automation Schema & Core

- **Skill:** `fullstack-backend`
- **Tareas:**
  - Tablas: `automation`, `automation_trigger`, `automation_action`, `automation_execution_log`
  - Tipos de trigger: `event`, `schedule`, `condition`
  - Tipos de acción: `whatsapp`, `email`, `update_record`, `create_task`
- **Validación:** Schema soporta flujos complejos

#### 4.2 Automation Execution Engine

- **Skill:** `fullstack-inngest`
- **Tareas:**
  - Inngest function: `execute-automation.ts`
  - Evaluar triggers de eventos (nueva cita, cita cancelada, stock bajo, etc.)
  - Ejecutar acciones en secuencia
  - Logging detallado
- **Validación:** Automatizaciones se ejecutan correctamente

#### 4.3 Frontend - Automation Builder

- **Skill:** `frontend`
- **Tareas:**
  - UI tipo "Zapier": Trigger → Conditions → Actions
  - Lista de automatizaciones con toggle on/off
  - Logs de ejecución
- **Validación:** Usuario puede crear flujo completo

---

### MILESTONE 5: Industry-Specific Automations

_Plantillas de automatización por industria_

#### 5.1 Business Type Configuration

- **Skill:** `fullstack-backend` + `frontend`
- **Tareas:**
  - Tabla `business_type` (beauty, health, fitness, professional, etc.)
  - Campo `profile.business_type_id`
  - UI: Selector en onboarding y settings
- **Validación:** Perfil guarda tipo de negocio correctamente

#### 5.2 Pre-built Automation Templates

- **Skill:** `fullstack-backend` + `frontend`
- **Tareas:**
  - Seed data: Plantillas por industria
    - Belleza: "Recordatorio post-tratamiento", "Reactivación clientes"
    - Fitness: "Recordatorio clase", "Promoción membresía"
    - General: "Cumpleaños", "Bienvenida", "Abandono"
  - UI: Galería de plantillas (aplicar y personalizar)
- **Validación:** Plantillas se aplican correctamente

#### 5.3 Advanced Automation Triggers

- **Skill:** `fullstack-inngest`
- **Tareas:**
  - Triggers: `birthday`, `inactivity`, `anniversary`, `low_stock`, `no_show`
  - Scheduler: Expresiones cron personalizadas
- **Validación:** Todos los triggers funcionan correctamente

---

### MILESTONE 6: Multi-Business Features

_Staff management y adaptaciones por industria_

#### 6.1 Staff/Employee Management

- **Skill:** `fullstack-backend` + `frontend`
- **Tareas:**
  - Tabla `staff` (empleados del negocio)
  - Roles: `admin`, `manager`, `staff`
  - Asignación de servicios a empleados
  - Horarios de disponibilidad por empleado
  - UI: Gestión de equipo, asignación a citas
- **Validación:** Citas pueden asignarse a empleados específicos

#### 6.2 Industry-Specific UI Adaptations

- **Skill:** `frontend`
- **Tareas:**
  - Terminología dinámica según tipo de negocio
    - Belleza: "Cliente", "Tratamiento", "Estilista"
    - Salud: "Paciente", "Consulta", "Doctor"
    - Fitness: "Miembro", "Clase", "Instructor"
- **Validación:** UI se adapta al tipo de negocio

#### 6.3 Service Packages & Memberships

- **Skill:** `fullstack-backend` + `frontend`
- **Tareas:**
  - Tabla `service_package` (paquetes de servicios)
  - Tabla `membership` (suscripciones recurrentes)
  - UI: Crear paquetes, vincular a citas
- **Validación:** Clientes pueden comprar paquetes

---

### MILESTONE 7: Enhanced AI Agent

_Agente IA con conocimiento de inventario y mejoras_

#### 7.1 AI Agent + Inventory Knowledge

- **Skill:** `fullstack-backend` (AI services) + `fullstack-inngest`
- **Tareas:**
  - Tool: `check_inventory` (consultar disponibilidad)
  - Tool: `get_product_info` (precio, descripción, stock)
  - Integrar con WhatsApp agent existente
- **Validación:** Agente responde correctamente sobre productos

#### 7.2 AI-Powered Recommendations

- **Skill:** `fullstack-backend`
- **Tareas:**
  - Sistema de recomendación de servicios basado en historial
  - Sugerencias de upsell en conversaciones
- **Validación:** Recomendaciones son relevantes

---

### MILESTONE 8: Reporting & Analytics

_Dashboards y reportes avanzados_

#### 8.1 Inventory Reports

- **Skill:** `fullstack-backend` + `frontend`
- **Tareas:**
  - Reporte de rotación de inventario
  - Valoración de stock actual
  - Productos más consumidos
  - Exportar a Excel/PDF
- **Validación:** Reportes generan datos correctos

#### 8.2 Automation Analytics

- **Skill:** `frontend`
- **Tareas:**
  - Métricas: ejecuciones, tasa de éxito, más usadas
  - Dashboard de logs filtrable
- **Validación:** Métricas calculadas correctamente

#### 8.3 Enhanced Business Dashboard

- **Skill:** `frontend`
- **Tareas:**
  - KPIs por industria
  - Comparativas mes a mes
  - Alertas consolidadas
- **Validación:** Dashboard útil y responsive

---

### MILESTONE 9: Testing & Quality

_Cobertura de tests y documentación_

#### 9.1 Test Coverage

- **Skill:** `fullstack-backend` (tests)
- **Tareas:**
  - Unit tests: Repositories y Business services (>80% coverage)
  - Integration tests: API endpoints
  - E2E tests: Flujos críticos
- **Validación:** `bun run test` pasa con >80% coverage

#### 9.2 Documentation

- **Tareas:**
  - API documentation (Swagger/OpenAPI annotations)
  - Guía de uso del motor de automatizaciones
  - Playbook de migración para usuarios existentes
  - Actualizar README con nuevos módulos
- **Validación:** Documentación clara y completa

---

## Arquitectura y Patrones

### Backend (fullstack-backend)

```
src/
├── db/schema/              # Tablas Drizzle
│   ├── product.ts
│   ├── inventory.ts
│   ├── supplier.ts
│   └── automation.ts
├── services/
│   ├── repository/         # Acceso a datos
│   ├── business/          # Lógica de negocio
│   └── infrastructure/    # Integraciones externas
├── api/routes/            # Endpoints Elysia
└── inngest/functions/    # Background jobs
```

### Frontend (frontend)

```
src/
├── features/
│   ├── inventory/
│   │   ├── components/
│   │   └── pages/
│   └── automation/
├── components/ui/         # shadcn/ui
└── routes/               # React Router v7
```

### Reglas Críticas

1. **Siempre** registrar servicios en `src/plugins/services.ts`
2. **Siempre** usar patrón Repository + Business
3. **Nunca** usar `new` dentro de clases, usar DI
4. **Siempre** tipar parámetros en callbacks
5. **Siempre** verificar schema exports en singular (ej: `product`, no `products`)
6. **Mantener** backwards compatibility con usuarios existentes

---

## Criterios de Validación Globales

- [ ] **Funcionalidad**: Inventario gestiona stock, automatizaciones ejecutan, multi-business funciona
- [ ] **Calidad**: TypeScript strict, linting limpio, tests >80%
- [ ] **Integración**: Inventario ↔ Servicios ↔ Citas funciona correctamente
- [ ] **Backwards Compatibility**: Usuarios existentes no se ven afectados
- **Naming**: Usar "CitaBot" en toda la documentación
- [ ] **UX**: UI intuitiva, flujos claros, mensajes de error útiles

---

## Formato de Ejecución para Droid

```
/enter-mission

Goal:
Transform CitaBot from beauty/agenda platform to multi-business SaaS platform
with complete inventory management and automation engine.

Stack:
- Backend: Bun + Elysia + Drizzle ORM + PostgreSQL + Inngest
- Frontend: React 19 + Vite + React Router 7 + Tailwind v4 + shadcn/ui
- Auth: Better Auth
- Jobs: Inngest
- AI: Vercel AI SDK / VoltAgent

Orchestrator:
Use "leon" skill to coordinate specialized skills:
- fullstack-backend for database and API
- fullstack-inngest for background jobs and automations
- fullstack-auth-better for multi-tenancy and roles
- frontend for UI components and forms
- fullstack-infrastructure if project structure changes needed

Existing Architecture:
- Repository/Business pattern in services/
- Drizzle schema in db/schema/
- Inngest jobs in inngest/functions/
- React Router v7 file-based routing
- Better Auth already configured

Brand:
- Name: CitaBot
- Logo: LogoCitaBot component
- Theme: Morado/Violeta Tech

Milestones:
1. Inventory Foundation (schema, API, UI)
2. Supplier & Purchase Orders
3. Inventory Integration with Services
4. Automation Engine Core
5. Industry-Specific Automations
6. Multi-Business Features
7. Enhanced AI Agent
8. Reporting & Analytics
9. Testing & Quality

Critical Rules:
- Always register services in src/plugins/services.ts
- Always use Repository + Business pattern
- Never use 'new' inside classes (use DI)
- Always check schema export names (singular)
- Maintain backwards compatibility with existing users
- Write code in English, user messages in Spanish
- Use "CitaBot" branding throughout
```

---

## Notas Adicionales

### Consideraciones Técnicas

1. **Migraciones**: Usar migraciones Drizzle con backwards compatibility
2. **Feature Flags**: Implementar para activar/desactivar módulos por negocio
3. **Performance**: Queries optimizados, jobs async no bloquean
4. **Seguridad**: Validar permisos a nivel de recurso

### Skills de LEON a Utilizar

| Milestone | Skills Principales                                 |
| --------- | -------------------------------------------------- |
| 1         | fullstack-backend, frontend                        |
| 2         | fullstack-backend, frontend, fullstack-inngest     |
| 3         | fullstack-backend, fullstack-inngest               |
| 4         | fullstack-backend, fullstack-inngest, frontend     |
| 5         | fullstack-backend, frontend, fullstack-inngest     |
| 6         | fullstack-backend, frontend, fullstack-auth-better |
| 7         | fullstack-backend, fullstack-inngest               |
| 8         | fullstack-backend, frontend                        |
| 9         | fullstack-backend                                  |

---

**Documento preparado para ejecución por Droid**  
**Fecha:** 7 de Marzo, 2026
