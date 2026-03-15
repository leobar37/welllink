# Architecture

Architectural decisions and patterns for CitaBot.

## Backend Architecture

### Layer Structure
```
src/
├── db/schema/        # Drizzle table definitions
├── services/
│   ├── repository/   # Data access layer
│   ├── business/     # Business logic layer
│   └── infrastructure/ # External integrations
├── api/routes/       # Elysia route handlers
├── plugins/          # DI and middleware
└── inngest/functions/# Background jobs
```

### Repository Pattern
- One repository per entity
- Direct Drizzle ORM usage
- Methods: create, findById, findByProfileId, update, delete (soft)

### Business Service Pattern
- Orchestrates multiple repositories
- Contains validation logic
- Never uses `new`, always DI

### Dependency Injection
- Services registered in `src/plugins/services.ts`
- Available via `ctx.services` in routes
- Constructor injection for service dependencies

## Frontend Architecture

### Routing
- File-based routing with React Router 7
- Routes in `src/routes/`
- Layout routes for dashboard sections

### State Management
- React Query for server state
- React Hook Form for forms
- Zustand or Jotai for client state (if needed)

### Component Structure
- shadcn/ui for base components
- Feature-specific components in `src/features/`
- Page components in `src/pages/`

## Database Conventions

### Table Naming
- **ALWAYS SINGULAR**: `product`, `asset`, `socialClick`
- Never plural: ~~`products`~~, ~~`assets`~~

### Field Naming
- camelCase for TypeScript
- snake_case in database (Drizzle handles mapping)
- Timestamps: `createdAt`, `updatedAt`, `deletedAt` (soft delete)

### Relations
- Define in schema with `relations()`
- Access via relation name: `product.category`, not `product.categoryId`

## API Conventions

### Response Format
```json
{
  "data": { ... },
  "error": null | { "message": "...", "code": "..." }
}
```

### Status Codes
- 200: Success
- 201: Created
- 400: Bad Request (validation)
- 401: Unauthorized
- 404: Not Found
- 409: Conflict (duplicate, etc.)
- 500: Server Error

## Testing Strategy

### Unit Tests
- Repository methods
- Business service logic
- Inngest function logic

### Integration Tests
- API endpoints
- Database operations

### E2E Tests
- Critical user flows
- Cross-feature integration
