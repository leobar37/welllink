# MediApp — Agent Memory

## Mission

- Deliver the web and API experiences described in [`docs/global-prd.md`](./docs/global-prd.md) and the seven module briefs under [`docs/modules`](./docs/modules).
- Preserve the Tailwind CSS v4 + shadcn/ui setup on the frontend (`packages/web`) and the Bun + Elysia stack on the backend (`packages/api`).

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

## Operating Guidelines

1. **Context first:** Re-read the PRD section and the relevant module doc before touching a feature. Every PR/branch should cite the specific module file.
2. **CLI-driven scaffolding:**
   - Frontend: `bun create vite`, `bunx shadcn@canary`, Tailwind v4 (no `tailwind.config.js`).
   - Backend: `bun create elysia` + Bun native tooling.
3. **Styling:**
   - Use Tailwind v4 utilities, `@theme inline`, and CSS variables defined in `src/index.css`.
   - Prefer shadcn/ui components added via the CLI registry.
4. **Routing:** Frontend routing must go through React Router 7; backend endpoints hang from `/api/*` in Elysia.
5. **Validation:** Run `bun install`, `bun run lint`, and the relevant `bun run dev:*` (or tests) before delivering work.
6. **Documentation sync:** Update module docs only when product scope changes; otherwise, append implementation notes to code comments or PR summaries.
7. **Language rule:** Write everything in English except user-facing messages, which should be in Spanish.

## Backend Rules (Drizzle + Elysia)

### Schema First — ALWAYS read before coding

```bash
# Before importing ANY table, check the actual export name:
cat packages/api/src/db/schema/index.ts
cat packages/api/src/db/schema/<table>.ts
```

### Drizzle Naming Convention

- Tables are exported in **SINGULAR**: `profile`, `asset`, `socialClick`, `profileView`
- **NEVER** assume plural names (`profiles`, `assets`, `socialClicks`)
- Check field names — not all tables use `createdAt` (some use `viewedAt`, `clickedAt`)

### Service + DI Checklist

When creating a new service:

1. Create repository in `src/services/repository/`
2. Create business service in `src/services/business/`
3. **REGISTER in `src/plugins/services.ts`** — services won't work without this step
4. Inject via constructor, never use `new` inside classes

### TypeScript Strict Mode

- **Always type** callback parameters in `reduce`, `map`, `filter`:

  ```typescript
  // BAD
  items.reduce((acc, item) => ...)

  // GOOD
  items.reduce((acc: number, item: Item) => ...)
  ```

- Import types from schema: `import type { Asset } from "../../db/schema/asset"`

### Relations Access

- Nested fields (from `with: {}`) are accessed via relation name, not directly:
  ```typescript
  // Schema: socialClick has relation to socialLink
  // BAD: click.platform
  // GOOD: click.socialLink.platform
  ```

## Media Script

A CLI script for image and video generation using Replicate AI models.

**Location:** `scripts/media.ts`
**Documentation:** `docs/media-script.md`

**Common uses:**

```bash
# Generate profile image for wellness professional
bun run media nano -p "Minimalist wellness logo" -o logo.jpg

# Remove background from image
bun run media remove-bg -i photo.jpg -o photo-clean.png

# Generate promotional video
bun run media hailuo -p "Inspiring wellness video" -q pro -o promo.mp4
```

**Available Commands:**

- **Images:** `nano`, `flux`, `remove-bg`, `enhance`
- **Videos:** `hailuo`, `hailuo2`, `hailuo-fast`, `director`, `live`

## Quick Links

- `packages/web` — React 19 + Vite + Tailwind v4 + shadcn/ui.
- `packages/api` — Bun + Elysia REST API.
- `docs/modules` — Module-by-module MVP scope.
- `scripts/media.ts` — CLI script for multimedia content generation.
- `docs/media-script.md` — Complete media script documentation.

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: Bash("openskills read <skill-name>")
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>link</name>
<description>|</description>
<location>project</location>
</skill>

<skill>
<name>ai-sdk-expert</name>
<description>|</description>
<location>global</location>
</skill>

<skill>
<name>frontend</name>
<description>|</description>
<location>global</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
