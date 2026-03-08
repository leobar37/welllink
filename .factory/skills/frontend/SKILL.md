---
name: frontend
description: Frontend development with React 19 + Vite + React Router 7 + Tailwind v4 + shadcn/ui. Handles UI components, pages, and forms.
---

# Frontend Worker

Frontend development for CitaBot using React 19, Vite, React Router 7, Tailwind v4, and shadcn/ui.

## When to Use This Skill

Use for:
- UI components and pages
- Forms with validation
- Data tables with sorting/filtering
- Dashboard layouts
- Responsive design

## Work Procedure

### 1. Understand Existing Patterns

```bash
# Read existing components
cat packages/web/src/components/ui/*.tsx | head -100
ls packages/web/src/routes/dashboard/
```

### 2. Create Route

Create in `packages/web/src/routes/dashboard/`:

```typescript
// dashboard.inventory.tsx
import { InventoryPage } from "../pages/dashboard/Inventory";

export default function InventoryRoute() {
  return <InventoryPage />;
}
```

### 3. Create Page Component

Create in `packages/web/src/pages/dashboard/`:

```typescript
// Inventory.tsx
import { useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";

export function InventoryPage() {
  const [products, setProducts] = useState([]);
  
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Inventario</h1>
      <DataTable columns={columns} data={products} />
    </div>
  );
}
```

### 4. Use shadcn/ui Components

```bash
cd packages/web
bunx shadcn@canary add dialog
bunx shadcn@canary add form
bunx shadcn@canary add select
```

### 5. Forms with Validation

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  sku: z.string().min(1, "El SKU es requerido"),
  price: z.number().min(0, "El precio debe ser positivo"),
});

export function ProductForm() {
  const form = useForm({
    resolver: zodResolver(schema),
  });
  
  return (
    <Form {...form}>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre</FormLabel>
            <FormInput {...field} />
            <FormMessage />
          </FormItem>
        )}
      />
    </Form>
  );
}
```

### 6. API Integration

```typescript
import { useQuery, useMutation } from "@tanstack/react-query";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/inventory/products");
      return res.json();
    },
  });
}
```

### 7. Responsive Design

```typescript
// Mobile-first approach
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### 8. Spanish Language

All user-facing text must be in Spanish:

```typescript
// GOOD
<Button>Guardar Producto</Button>
<Label>Nombre del Producto</Label>

// BAD
<Button>Save Product</Button>
```

### 9. Testing

```bash
cd packages/web
bun run typecheck
bun run lint
bun run build
```

### 10. Manual Verification

Use Playwright for UI testing:

```typescript
// Verify page loads
await page.goto("http://localhost:5176/dashboard/inventory");
await expect(page.getByText("Inventario")).toBeVisible();

// Verify form submission
await page.getByLabel("Nombre").fill("Producto Test");
await page.getByRole("button", { name: "Guardar" }).click();
await expect(page.getByText("Producto creado")).toBeVisible();
```

## Example Handoff

```json
{
  "salientSummary": "Created inventory dashboard with product list, create/edit modals, and stock adjustment form. Used shadcn/ui DataTable with sorting and filtering. All UI text in Spanish. Responsive design verified.",
  "whatWasImplemented": "Inventory dashboard page at /dashboard/inventory with DataTable showing products with columns: SKU, nombre, categoría, stock, precio. Product form modal with fields: nombre, SKU, descripción, precio, costo, categoría, proveedor. Stock adjustment modal with cantidad and motivo fields. Supplier management page with CRUD operations. All components use shadcn/ui, Tailwind v4, and Spanish text.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "bun run typecheck", "exitCode": 0, "observation": "No type errors" },
      { "command": "bun run lint", "exitCode": 0, "observation": "No lint errors" },
      { "command": "bun run build", "exitCode": 0, "observation": "Build successful" }
    ],
    "interactiveChecks": [
      { "action": "Loaded /dashboard/inventory", "observed": "Product table displayed with correct columns" },
      { "action": "Clicked 'Nuevo Producto' button", "observed": "Modal opened with form fields" },
      { "action": "Submitted form with valid data", "observed": "Product created, table refreshed" },
      { "action": "Tested responsive at 375px width", "observed": "Layout adapted correctly" }
    ]
  },
  "tests": {
    "added": []
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- shadcn/ui component not available or conflicts
- React Router patterns unclear
- API endpoints not available yet
- Design system questions
- Responsive design challenges
