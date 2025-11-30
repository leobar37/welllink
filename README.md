# Wellness Link Monorepo

Plataforma para tarjetas digitales de asesores de bienestar conforme al [PRD funcional](./docs/global-prd.md). Este repositorio usa Bun workspaces para agrupar el frontend (React Router + Tailwind CSS v4 + shadcn/ui) y el backend (Bun + Elysia).

## Repository layout

```
.
├── docs/
│   ├── global-prd.md        # documento funcional principal
│   ├── feature-1-evaluation.md
│   └── modules/01-07        # resumen en inglés de cada módulo del PRD
├── packages/
│   ├── web/                 # React 19 + Vite + React Router + Tailwind v4 + shadcn/ui
│   └── api/                 # Bun + Elysia service with health + module endpoints
├── package.json             # scripts y workspaces
├── bunfig.toml              # instalación aislada en workspaces
└── README.md
```

## Requirements

- [Bun ≥ 1.3.1](https://bun.sh/) instalado globalmente
- macOS/Linux (se probó en Darwin 24.5.0)

Referencias clave consultadas:

- Bun workspaces & bunfig: <https://bun.com/docs/runtime/bunfig>
- Tailwind v4 + shadcn Vite guide: <https://ui.shadcn.com/docs/installation/vite>
- Elysia getting started: <https://elysiajs.com/guide/getting-started>

## Setup

```bash
bun install                # instala dependencias de todos los packages
bun run dev:web            # inicia Vite + React Router + Tailwind v4
bun run dev:api            # levanta Bun + Elysia en http://localhost:3000
bun run dev                # helper: abre frontend en modo dev

# utilidades adicionales
bun run build              # build de api + web
bun run lint               # lint de ambos paquetes (web usa ESLint, api ejecuta tsc --noEmit)
```

## Packages

| Package        | Stack / Notas |
|----------------|----------------|
| `packages/web` | Vite + React 19 + React Router 7, Tailwind CSS v4 sin `tailwind.config.js`, shadcn/ui (`components.json` con estilo *new-york*, `tw-animate-css`, `@tailwindcss/vite`). Incluye rutas básicas (Home + Modules) para validar el router y la capa de estilos. |
| `packages/api` | Bun + Elysia con prefijo `/api`, endpoints `/health` y `/modules` (placeholders) alineados al PRD. Scripts `dev`, `start`, `lint`. |

## Module docs

Los módulos del PRD se desglosan en inglés en `docs/modules`:

1. [Authentication & Onboarding](./docs/modules/01-auth-onboarding.md)
2. [Public Profile](./docs/modules/02-public-profile.md)
3. [Themes & Personalization](./docs/modules/03-themes.md)
4. [Feature System](./docs/modules/04-features.md)
5. [QR & Virtual Card](./docs/modules/05-qr-card.md)
6. [Dashboard](./docs/modules/06-dashboard.md)
7. [Account Settings](./docs/modules/07-settings.md)

Consulta también [feature-1-evaluation.md](./docs/feature-1-evaluation.md) para el detalle de la encuesta de salud.
