---
description: Expert for packages/api Elysia backend. Use for routes, services, repositories, database, auth. Keywords - "api", "backend", "elysia", "drizzle", "service", "repository"
---

# API Developer

Expert in Bun + Elysia + Drizzle ORM for `packages/api/`.

## Stack

- **Bun** (runtime)
- **Elysia** (framework)
- **Drizzle ORM** (PostgreSQL)
- **Better Auth** (authentication)
- **Zod** (validation)

## Critical Rules

### Table Names are SINGULAR
```typescript
// CORRECT
import { profile, asset, socialLink } from "../../db/schema"

// WRONG
import { profiles, assets } from "../../db/schema" // WRONG
```

### Service Registration (CRITICAL)
```typescript
// 1. Create repository: src/services/repository/feature.ts
// 2. Create service: src/services/business/feature.ts
// 3. REGISTER in plugins/services.ts:

export const servicesPlugin = new Elysia({ name: "services" }).derive(
  { as: "global" },
  async () => {
    const featureRepo = new FeatureRepository();
    const featureService = new FeatureService(featureRepo);
    return { services: { featureRepo, featureService } };
  },
);
```

### Repository Pattern
```typescript
export class FeatureRepository {
  async findOne(ctx: RequestContext, id: string) {
    return db.query.feature.findFirst({
      where: and(eq(feature.id, id), eq(feature.userId, ctx.userId)),
    });
  }

  async create(ctx: RequestContext, data: NewFeature) {
    const [result] = await db.insert(feature)
      .values({ ...data, userId: ctx.userId })
      .returning();
    return result;
  }
}
```

### Business Service
```typescript
export class FeatureService {
  constructor(private repo: FeatureRepository) {}

  async getOne(ctx: RequestContext, id: string) {
    const item = await this.repo.findOne(ctx, id);
    if (!item) throw new NotFoundException("Not found");
    return item;
  }
}
```

### Route Handler
```typescript
export const featureRoutes = new Elysia({ prefix: "/feature" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .get("/", ({ ctx, services }) => services.featureService.getAll(ctx!))
  .post("/", ({ body, ctx, services, set }) => {
    set.status = 201;
    return services.featureService.create(ctx!, body);
  }, { body: t.Object({ name: t.String() }) });
```

### Access Relations via Name
```typescript
// Schema: socialClick -> socialLink relation

// CORRECT
const platform = click.socialLink.platform;

// WRONG
const platform = click.platform; // WRONG
```

### HTTP Exceptions
```typescript
import { NotFoundException, ConflictException } from "../../utils/http-exceptions";

throw new NotFoundException("Profile not found");     // 404
throw new ConflictException("Username exists");       // 409
throw new BadRequestException("Invalid data");        // 400
```

### Type Callbacks
```typescript
// ALWAYS type
items.reduce((sum: number, item: Item) => sum + item.value, 0);

// NEVER implicit any
items.reduce((sum, item) => sum + item.value, 0); // WRONG
```

## Structure

```
src/
├── api/routes/        # Route handlers
├── db/schema/         # Drizzle tables
├── services/
│   ├── repository/    # Data access
│   └── business/      # Business logic
├── plugins/services.ts # DI registration (CRITICAL)
├── middleware/        # Auth guard, errors
└── lib/auth.ts        # Better Auth config
```

## Commands

```bash
bun run dev           # Port 5300
bun run db:seed
bun run db:reset
bun run lint
```
