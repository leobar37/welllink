# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Mission

Deliver the web and API experiences described in [`docs/global-prd.md`](./docs/global-prd.md) and the seven module briefs under [`docs/modules`](./docs/modules). Preserve the Tailwind CSS v4 + shadcn/ui setup on the frontend (`packages/web`) and the Bun + Elysia stack on the backend (`packages/api`).

## Knowledge Anchors

- **PRD:** `docs/global-prd.md` (spanish), plus `docs/feature-1-evaluation.md` for the Health Survey feature.
- **Module briefs:** `docs/modules/01-07-*.md` (English). Reference the matching module number before implementing changes.
- **Tech guides:**
  - Bun runtime & bunfig — <https://bun.com/docs/runtime/bunfig>
  - Tailwind v4 + shadcn for Vite — <https://ui.shadcn.com/docs/installation/vite>
  - Elysia getting started — <https://elysiajs.com/guide/getting-started>

## Available Skills

- `react-router` — Use for any frontend navigation/state questions or when planning SPA flows.
- `bun-elysia` — Use for backend architecture, routing, validation, or Bun server questions.

## Project Structure

```
mediapp/
├── docs/                           # Documentation and PRDs
├── packages/
│   ├── web/                       # React 19 + Vite + React Router + Tailwind v4 + shadcn/ui
│   │   └── src/
│   │       ├── components/        # UI components (shadcn/ui + custom)
│   │       ├── routes/           # File-based routing (React Router 7)
│   │       │   ├── _public/      # Public routes (profile viewing)
│   │       │   ├── auth/         # Authentication pages
│   │       │   ├── dashboard/    # Protected dashboard routes
│   │       │   └── onboarding/   # New user setup flow
│   │       ├── hooks/            # Custom React hooks
│   │       ├── layouts/          # Page layouts
│   │       ├── lib/              # Utilities and API client
│   │       └── pages/            # Page components
│   └── api/                       # Bun + Elysia REST API
│       └── src/
│           ├── api/routes/       # API route handlers by feature
│           ├── db/schema/        # Database schema definitions
│           ├── services/         # Business logic layer (business + repository)
│           ├── plugins/          # Elysia plugins and DI
│           └── lib/auth.ts       # Better Auth configuration
├── bunfig.toml                    # Bun workspaces configuration
└── package.json                   # Root package with workspaces
```

## Development Preferences

### Language Support

- **User-facing text**: Spanish (dashboard, forms, buttons, etc.)
- **Technical documentation**: English (API, code comments, README)
- All UI text must be in Spanish

### Design System

- **Theme-aware**: All components must support light/dark theme switching
- **Responsive**: Mobile-first design, check breakpoints for all new components
- Use Tailwind v4 utilities and CSS variables from `src/index.css`
- Prefer shadcn/ui components when available

### Runtime

- Uses **Bun** for both frontend and backend development
- Monorepo with workspaces configuration

## Backend Rules (Drizzle + Elysia)

### Schema First

- Always check table names in `packages/api/src/db/schema/index.ts` before importing
- Tables use **SINGULAR** names: `profile`, `asset`, `socialClick`
- Check field names - not all use `createdAt` (some use `viewedAt`, `clickedAt`)

### Service Pattern

1. Create repository in `src/services/repository/`
2. Create business service in `src/services/business/`
3. **REGISTER in `src/plugins/services.ts`** - services won't work without this
4. Use dependency injection, never `new` inside classes

### TypeScript Strict Mode

- Always type callback parameters in `reduce`, `map`, `filter`
- Import types from schema: `import type { Asset } from "../../db/schema/asset"`

### Relations Access

- Access nested fields via relation name, not directly:
  ```typescript
  // Schema: socialClick has relation to socialLink
  // BAD: click.platform
  // GOOD: click.socialLink.platform
  ```

## Architecture Notes

### Authentication

- Better Auth with email/password
- Sessions: 7 days expiry, 1 day update age
- Auth routes handled automatically by Better Auth handler
- Frontend uses `authClient` hook for session management

### API Communication

- Backend: port 5300, Frontend: port 5176 (development)
- Type safety through edenTreaty with shared App type
- CORS configured for development

### Frontend Routing

- File-based routing via @react-router/fs-routes
- Layout hierarchy: AuthLayout, DashboardLayout, PublicLayout
- Protected dashboard routes require authentication

## Key Database Tables

- **user**: Better Auth authentication
- **profile**: Wellness professional information
- **socialLink**: Orderable social media links
- **healthSurvey**: Visitor survey responses
- **analytics**: Profile views and clicks tracking
- **asset**: File uploads (avatars, images)

## Media Script

A CLI script for generating images and videos using Replicate AI models. Useful for creating profile visuals, promotional content, and multimedia resources for wellness professionals.

**Location:** `scripts/media.ts`
**Documentation:** `docs/media-script.md`

**Example usage:**

```bash
# Generate a profile image
bun run media nano -p "Professional wellness coach headshot" -o profile.jpg

# Remove background
bun run media remove-bg -i photo.jpg -o clean-photo.png

# Create promotional video
bun run media hailuo -p "Peaceful meditation scene" -q pro -o promo.mp4
```
