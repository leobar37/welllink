---
name: fullstack-backend
description: Backend development with Bun + Elysia + Drizzle ORM + PostgreSQL. Handles database schema, repositories, business services, and API routes.
---

# Full-Stack Backend Worker

Backend development for CitaBot using Bun, ElysiaJS, Drizzle ORM, and PostgreSQL.

## When to Use This Skill

Use for:
- Database schema creation and migrations
- Repository layer (data access)
- Business services (business logic)
- REST API endpoints
- Integration tests

## Work Procedure

### 1. Schema Creation

```bash
# Read existing schema patterns first
cat packages/api/src/db/schema/index.ts
cat packages/api/src/db/schema/profile.ts  # Example pattern
```

- Create schema file in `packages/api/src/db/schema/`
- Use singular table names: `product`, not `products`
- Define relations properly
- Add to `packages/api/src/db/schema/index.ts` exports

### 2. Migration

```bash
cd packages/api
bun run db:generate  # Generate migration
bun run db:migrate   # Apply migration
```

### 3. Repository Layer

Create in `packages/api/src/services/repository/`:

```typescript
export class ProductRepository {
  constructor(private db: Database) {}
  
  async create(data: InsertProduct) { ... }
  async findById(id: string) { ... }
  async findByProfileId(profileId: string) { ... }
  async update(id: string, data: Partial<InsertProduct>) { ... }
  async delete(id: string) { ... } // Soft delete
}
```

### 4. Business Service

Create in `packages/api/src/services/business/`:

```typescript
export class ProductService {
  constructor(
    private productRepo: ProductRepository,
    private inventoryRepo: InventoryRepository
  ) {}
  
  async createProduct(data: CreateProductInput) {
    // Validate SKU uniqueness
    // Create product
    // Create initial inventory record
  }
}
```

### 5. Service Registration

**CRITICAL:** Register in `packages/api/src/plugins/services.ts`:

```typescript
.decorate("services", {
  // ... existing services
  productService: new ProductService(productRepo, inventoryRepo),
})
```

### 6. API Routes

Create in `packages/api/src/api/routes/`:

```typescript
export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .use(servicesPlugin)
  .get("/products", async ({ query, services }) => {
    return services.productService.searchProducts(query);
  })
  .post("/products", async ({ body, services }) => {
    return services.productService.createProduct(body);
  });
```

### 7. Testing (TDD)

**Write tests FIRST (red), then implement (green):**

```typescript
// Repository test
import { describe, it, expect } from "bun:test";

describe("ProductRepository", () => {
  it("should create product with valid data", async () => {
    // Test implementation
  });
  
  it("should enforce SKU uniqueness", async () => {
    // Test implementation
  });
});
```

Run tests:
```bash
cd packages/api
bun test src/services/repository/product.repository.test.ts
```

### 8. Validation

```bash
cd packages/api
bun run typecheck
bun run lint
bun run test
```

## Example Handoff

```json
{
  "salientSummary": "Created inventory schema with product, inventory_item, stock_movement tables. Implemented ProductRepository and ProductService with CRUD operations. Registered services in plugin. All tests passing (12 cases).",
  "whatWasImplemented": "Database schema for inventory system including product table with SKU, name, price, cost fields; inventory_item for stock tracking; stock_movement for audit trail. Repository layer with create, findById, findByProfileId, update, delete methods. Business service with validation logic for SKU uniqueness and stock operations. Services registered in src/plugins/services.ts.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "bun run db:generate", "exitCode": 0, "observation": "Migration generated successfully" },
      { "command": "bun run db:migrate", "exitCode": 0, "observation": "Migration applied, tables created" },
      { "command": "bun run typecheck", "exitCode": 0, "observation": "No type errors" },
      { "command": "bun run lint", "exitCode": 0, "observation": "No lint errors" },
      { "command": "bun test src/services/repository/product.repository.test.ts", "exitCode": 0, "observation": "6 tests passing" },
      { "command": "bun test src/services/business/product.service.test.ts", "exitCode": 0, "observation": "6 tests passing" }
    ],
    "interactiveChecks": []
  },
  "tests": {
    "added": [
      { "file": "src/services/repository/product.repository.test.ts", "cases": [
        { "name": "should create product with valid data", "verifies": "Product creation" },
        { "name": "should find product by id", "verifies": "Product retrieval" },
        { "name": "should enforce SKU uniqueness", "verifies": "Data integrity" }
      ]},
      { "file": "src/services/business/product.service.test.ts", "cases": [
        { "name": "should validate SKU uniqueness on create", "verifies": "Business validation" },
        { "name": "should create initial inventory record", "verifies": "Inventory integration" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Database migration fails and cannot be resolved
- Schema design conflicts with existing tables
- Service registration pattern unclear
- Test infrastructure issues
- Type errors that require architectural changes
