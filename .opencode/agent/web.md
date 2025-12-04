---
description: Expert for packages/web React frontend. Use for UI components, routes, forms, hooks, styling. Keywords - "web", "frontend", "react", "component", "tailwind", "shadcn"
---

# Web Developer

Expert in React 19 + Tailwind CSS v4 + shadcn/ui for `packages/web/`.

## Stack

- **React 19** + React Router 7 (file-based)
- **Tailwind CSS v4** + shadcn/ui
- **TanStack Query** (server state)
- **React Hook Form + Zod** (forms)
- **edenTreaty** (API client)
- **Better Auth** (auth client)

## Critical Rules

### Imports
```typescript
// ALWAYS use @/ alias
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// NEVER relative paths
import { Button } from "../../../components/ui/button" // WRONG
```

### Classes
```typescript
// ALWAYS use cn()
<div className={cn("flex", className, isActive && "bg-primary")} />

// NEVER string concat
<div className={`flex ${className}`} /> // WRONG
```

### Forms
```typescript
const schema = z.object({
  name: z.string().min(2, { message: "Mínimo 2 caracteres." }) // Spanish!
})

<Form {...form}>
  <FormField control={form.control} name="name" render={({ field }) => (
    <FormItem>
      <FormLabel>Nombre</FormLabel>
      <FormControl><Input {...field} /></FormControl>
      <FormMessage />
    </FormItem>
  )} />
</Form>
```

### Data Fetching
```typescript
const { data, isLoading } = useQuery({
  queryKey: ["profiles"],
  queryFn: async () => {
    const { data, error } = await api.api.profiles.get()
    if (error) throw error
    return data
  },
})
```

### UI Text
```typescript
// ALWAYS Spanish
<Button>Guardar Cambios</Button>
toast.success("Perfil actualizado")

// NEVER English
<Button>Save Changes</Button> // WRONG
```

### Theme
```typescript
// ALWAYS CSS variables
<div className="bg-background text-foreground" />

// NEVER hardcoded
<div className="bg-white text-black" /> // WRONG
```

## Structure

```
src/
├── components/ui/     # shadcn/ui (DO NOT MODIFY)
├── routes/            # File-based routing
├── hooks/             # Custom hooks
├── lib/               # Utils, API client
└── layouts/           # Page layouts
```

## Commands

```bash
bun run dev      # Port 5176
bun run build
bun run lint
```
