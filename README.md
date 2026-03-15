# CitaBot - Plataforma SaaS Multi-Industria

Plataforma de gestión empresarial para negocios de servicios con IA, inventario y automatizaciones. Evolución de **MediApp** transformada en **CitaBot** para belleza, salud, fitness y más.

## Repository Layout

```
.
├── docs/
│   ├── global-prd.md              # Documento funcional principal
│   ├── CITABOT-REBRAND-PLAN.md    # Plan de rebrand de MediApp
│   ├── CITABOT-EVOLUTION-MISSION.md # Misión de evolución SaaS
│   ├── migration-playbook.md      # Guía de migración a CitaBot Pro
│   ├── automation-builder-guide.md # Guía del constructor de automatizaciones
│   ├── inventory-guide.md         # Guía de gestión de inventario
│   ├── api-docs.md                # Documentación API (Swagger)
│   ├── modules/                   # Módulos del PRD
│   │   ├── 01-auth-onboarding.md
│   │   ├── 02-public-profile.md
│   │   ├── 09-whatsapp-integration.md
│   │   ├── 10-crm-medico-ai.md
│   │   └── ...
│   └── tech/                     # Guías técnicas
├── packages/
│   ├── web/                      # React 19 + Vite + React Router + Tailwind v4 + shadcn/ui
│   └── api/                      # Bun + Elysia service with inventory, automations, staff
├── migrations/                    # Planes de migración
├── package.json                   # Scripts y workspaces
├── bunfig.toml                   # Instalación aislada en workspaces
└── README.md
```

## Módulos y Funcionalidades

### Módulos Principales

| Módulo | Descripción | Documentación |
|--------|-------------|---------------|
| **Inventario** | Control de productos, stock, proveedores, órdenes de compra | [Guía](./docs/inventory-guide.md) |
| **Automatizaciones** | Constructor visual, triggers, acciones, plantillas | [Guía](./docs/automation-builder-guide.md) |
| **Staff** | Gestión de empleados, roles, horarios, servicios | - |
| **Reportes** | KPIs, rotación de inventario, métricas de automatización | - |
| **Multinegocio** | Tipos de negocio, terminología adaptativa | - |

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Bun + Elysia + Drizzle ORM + PostgreSQL |
| Frontend | React 19 + Vite + React Router 7 + Tailwind v4 |
| Auth | Better Auth |
| Jobs | Inngest |
| WhatsApp | Evolution API |
| AI | Vercel AI SDK / VoltAgent |

## Setup

```bash
# Instalar dependencias
bun install

# Desarrollo
bun run dev:web            # Frontend (puerto 5176)
bun run dev:api            # Backend API (puerto 5300)
bun run dev                # Abrir frontend

# Producción
bun run build              # Build de api + web
bun run lint               # Linting (ESLint + tsc --noEmit)
```

## Documentación de Usuario

### Guías Recientes

- **[Guía de Inventario](./docs/inventory-guide.md)** - Gestión de productos, stock, proveedores
- **[Guía de Automatizaciones](./docs/automation-builder-guide.md)** - Constructor visual, triggers, acciones
- **[Playbook de Migración](./docs/migration-playbook.md)** - Actualiza de CitaBot Básico a Pro
- **[API Documentation](./docs/api-docs.md)** - Referencia completa de endpoints

### Guías por Área

| Área | Archivo |
|------|---------|
| Inventory | `docs/inventory-guide.md` |
| Automations | `docs/automation-builder-guide.md` |
| Migration | `docs/migration-playbook.md` |
| API | `docs/api-docs.md` |
| AI Agent | `docs/ai-agent-reference.md` |

## Estructura de Paquetes

### packages/web

**Stack:** Vite + React 19 + React Router 7 + Tailwind CSS v4 + shadcn/ui

Rutas del dashboard:
- `/dashboard` - Dashboard principal
- `/dashboard/inventory` - Gestión de inventario
- `/dashboard/suppliers` - Proveedores
- `/dashboard/purchase-orders` - Órdenes de compra
- `/dashboard/automations` - Constructor de automatizaciones
- `/dashboard/automations-analytics` - Métricas de automatizaciones
- `/dashboard/staff` - Gestión de empleados
- `/dashboard/clients` - CRM de clientes
- `/dashboard/services` - Catálogo de servicios
- `/dashboard/business` - Configuración de negocio

### packages/api

**Stack:** Bun + Elysia + Drizzle ORM + Inngest

Rutas API principales:
- `/api/inventory/*` - Endpoints de inventario
- `/api/automations/*` - Endpoints de automatizaciones
- `/api/staff/*` - Endpoints de staff
- `/api/clients/*` - Endpoints de clientes
- `/api/reports/*` - Endpoints de reportes
- `/api/health` - Health check
- `/api/modules` - Estado de módulos

## Industrias Soportadas

CitaBot se adapta a múltiples industrias:

- **Belleza**: Spas, peluquerías, barberías, salones de uñas
- **Salud**: Consultorios, clínicas, terapeutas
- **Fitness**: Gimnasios,瑜伽 estudios, entrenadores
- **Servicios**: Talleres, consultores, profesionales

La terminología y características se adaptan según el tipo de negocio seleccionado.

## Recursos

### Enlaces Externos

- [CitaBot Docs](https://docs.citabot.io) - Documentación oficial
- [ElysiaJS](https://elysiajs.com) - Framework backend
- [Tailwind CSS v4](https://tailwindcss.com) - Estilos
- [shadcn/ui](https://ui.shadcn.com) - Componentes
- [Drizzle ORM](https://orm.drizzle.team) - ORM

### Configuración de Servicios

| Servicio | Puerto | Propósito |
|----------|-------|-----------|
| API (Elysia) | 5300 | Backend REST API |
| Web (Vite) | 5176 | Frontend React |
| PostgreSQL | 5432 | Base de datos |
| Inngest Dev | 8288 | Background jobs |

## Desarrollo

### Comandos Disponibles

```bash
# Instalar
bun install              # Instalar todas las dependencias
bun run clean           # Limpiar node_modules

# Desarrollo
bun run dev             # Iniciar frontend
bun run dev:web        # Solo frontend
bun run dev:api        # Solo backend
bun run dev:all       # Frontend + Backend

# Calidad de código
bun run lint           # ESLint + TypeScript
bun run typecheck      # Solo TypeScript
bun run test           # Tests unitarios

# Build
bun run build          # Build producción
bun run build:web     # Solo frontend
bun run build:api     # Solo backend
```

### Tests

```bash
# Unit tests
bun run test

# E2E tests (requiere servicios corriendo)
cd packages/web
bunx playwright test
```

## Guías Técnicas

### Base de Datos

- Esquemas en `packages/api/src/db/schema/`
- Migraciones en `packages/api/src/db/migrations/`
- Naming: tablas en singular (product, inventory, automation)

### Servicios

Patrón Repository + Business + Infrastructure:
- Repository: `packages/api/src/services/repository/`
- Business: `packages/api/src/services/business/`
- Registrados en: `packages/api/src/plugins/services.ts`

### Frontend

- Componentes en `packages/web/src/components/`
- Páginas en `packages/web/src/pages/`
- Rutas en `packages/web/src/routes/`
- Hooks en `packages/web/src/hooks/`

---

## Licencia y Contacto

**CitaBot** - Tu recepcionista virtual con IA

- Email: soporte@citabot.io
- Web: https://citabot.io
- Docs: https://docs.citabot.io
