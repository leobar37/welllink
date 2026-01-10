---
description: Load wellness-link full-stack monorepo expert skill. Use for features spanning web (React 19) and api (Bun + Elysia).
subtask: false
---

# Wellness Link - Full-Stack Monorepo Expert

This command loads the `link` skill which provides expert guidance for wellness-link monorepo development.

## How It Works

1. Loads the skill content from `.claude/skills/link/`
2. Provides full-stack patterns, workflows, and best practices
3. Covers both `packages/web` (React 19 + Tailwind v4) and `packages/api` (Bun + Elysia)

## When to Use

- Implementing features that span both web and api packages
- Setting up new API endpoints with frontend integration
- Working with shared types across packages
- Monorepo workflow questions
- Cross-package refactoring
- Full-stack feature development

## What It Includes

### Patterns

- Full-Stack Workflow guide
- Monorepo Commands reference

### Agent References

- Web Agent quick reference
- API Agent quick reference

### Key Topics Covered

- Type sharing between packages
- Workspace commands
- Critical rules for web (React 19, Tailwind v4, shadcn/ui)
- Critical rules for API (Bun, Elysia, Drizzle)
- Database migrations
- Service + DI pattern
- Authentication flows
- File uploads
- Error handling

## Available Commands

```bash
# Monorepo
bun run dev              # Both packages
bun --filter @wellness-link/web dev    # Web only
bun --filter @wellness-link/api dev    # API only

# Web
cd packages/web
bun run dev             # Port 5176
bun run build
bun run lint

# API
cd packages/api
bun run dev             # Port 5300
bun run db:seed
bun run db:reset
bun run lint
```

## Key Tables

- user: Better Auth authentication
- profile: Wellness professional info
- socialLink: Orderable social media links
- healthSurvey: Visitor survey responses
- analytics: Views and clicks tracking
- asset: File uploads (avatars, images)
