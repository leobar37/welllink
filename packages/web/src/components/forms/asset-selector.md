# AssetSelector

Componente reutilizable para seleccionar y subir archivos (assets) con integración completa con React Hook Form.

## 📦 Instalación

El componente depende de `react-dropzone` que ya está instalado en el proyecto.

## 🎯 Características

- ✅ **Integración con React Hook Form**: Usa `FormField` del proyecto
- ✅ **Dos modos de selección**:
  - Galería: Seleccionar de archivos existentes
  - Subir nuevo: Arrastrar y soltar archivos
- ✅ **Responsive**: Diseño adaptativo para mobile y desktop
- ✅ **Preview de imágenes**: Muestra vista previa antes de subir
- ✅ **Filtrado por tipo**: Filtra assets por tipo (avatar, cover, image, document, etc.)
- ✅ **Validación**: Compatible con esquemas Zod
- ✅ **Manejo de errores**: Mensajes claros de error
- ✅ **Notificaciones**: Integración con `sonner` toast
- ✅ **Estados de carga**: Indicadores visuales durante upload

## 🚀 Uso Básico

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AssetSelector } from "@/components/forms/asset-selector";
import { Button } from "@/components/ui/button";

// Definir esquema de validación
const schema = z.object({
  avatarId: z.string().min(1, "Debes seleccionar una imagen"),
});

type FormValues = z.infer<typeof schema>;

function MyForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      avatarId: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log("Formulario enviado:", data);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <AssetSelector
        name="avatarId"
        label="Avatar"
        description="Selecciona una imagen para tu perfil"
        type="avatar"
        required
        userId="user-123"
      />
      <Button type="submit">Guardar</Button>
    </form>
  );
}
```

## 📋 Props

| Prop | Tipo | Requerido | Descripción |
|------|------|------------|-------------|
| `name` | `FieldPath<TFieldValues>` | ✅ Sí | Nombre del campo en el formulario |
| `label` | `string` | ❌ No | Etiqueta del campo (default: "Seleccionar Archivo") |
| `description` | `string` | ❌ No | Descripción de ayuda debajo del label |
| `type` | `AssetType` | ❌ No | Filtrar por tipo de asset (`"image" \| "avatar" \| "cover" \| "document" \| "story-image"`) |
| `required` | `boolean` | ❌ No | Indica si el campo es obligatorio (default: `false`) |
| `onAssetSelected` | `(assetId: string) => void` | ❌ No | Callback cuando se selecciona un asset |
| `userId` | `string` | ✅ Sí | ID del usuario para cargar sus assets |
| `maxSize` | `number` | ❌ No | Tamaño máximo del archivo en bytes (default: 5MB) |
| `accept` | `Record<string, string[]>` | ❌ No | Tipos de archivos aceptados (default: imágenes y PDFs) |

## 🔧 Tipos

```typescript
import type { AssetType } from "@/hooks/use-assets";

type AssetType = "image" | "document" | "avatar" | "cover" | "story-image";
```

## 🎨 Ejemplos de Uso

### 1. Selector de Avatar (Opcional)

```tsx
<AssetSelector
  name="avatarId"
  label="Foto de Perfil"
  description="Selecciona una imagen para tu avatar"
  type="avatar"
  userId="user-123"
/>
```

### 2. Selector de Imagen de Portada (Requerido)

```tsx
<AssetSelector
  name="coverId"
  label="Imagen de Portada"
  description="Esta imagen se mostrará en la parte superior de tu perfil"
  type="cover"
  required
  userId="user-123"
/>
```

### 3. Selector de Documentos PDF

```tsx
<AssetSelector
  name="documentId"
  label="Documento"
  description="Sube un archivo PDF para compartir"
  type="document"
  required
  userId="user-123"
  maxSize={10 * 1024 * 1024} // 10MB
  accept={{
    "application/pdf": [".pdf"],
  }}
/>
```

### 4. Selector Genérico (Sin filtro de tipo)

```tsx
<AssetSelector
  name="assetId"
  label="Archivo"
  description="Selecciona cualquier archivo de tu galería"
  userId="user-123"
  onAssetSelected={(assetId) => console.log("Asset seleccionado:", assetId)}
/>
```

## 🎨 Componentes UI Utilizados

El componente reutiliza los siguientes componentes de shadcn/ui del proyecto:

- `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`
- `Card`, `CardContent`, `CardDescription`, `CardHeader`
- `Tabs`, `TabsContent`, `TabsList`, `TabsTrigger`
- `Button`
- `Badge`
- `Spinner`

## 🔄 Hooks Utilizados

- `useFormContext` de `react-hook-form` para acceder al formulario
- `useDropzone` de `react-dropzone` para upload de archivos
- `useAssets` de `@/hooks/use-assets` para cargar y subir assets
- `useAssetUrl` de `@/hooks/use-asset-url` para obtener URLs de preview

## 📱 Responsive Design

El componente es responsive por defecto:

### Mobile (< 640px)
- Tabs: Stacked verticalmente
- Grid de galería: 2 columnas
- Dropzone: Full width

### Desktop (≥ 640px)
- Tabs: Side-by-side horizontalmente
- Grid de galería: 4 columnas (adaptable)
- Dropzone: Ancho razonable con padding

## 🐛 Manejo de Errores

El componente maneja automáticamente:

- **Archivos demasiado grandes**: Muestra error con límite de tamaño
- **Tipos de archivo no válidos**: Valida tipos aceptados
- **Error de upload**: Muestra toast de error
- **Error de validación**: Muestra mensajes del esquema Zod

## 🎭 Estados del Componente

1. **Estado inicial**: No hay asset seleccionado
2. **Asset seleccionado**: Muestra preview con botón de eliminar
3. **Subiendo archivo**: Muestra spinner y nombre del archivo
4. **Preview de upload**: Muestra imagen antes de confirmar subida

## 📝 Notas Importantes

- El componente maneja internamente el ID del asset como una string
- Usa `form.setValue()` y `form.watch()` para sincronizar con React Hook Form
- El callback `onAssetSelected` se llama tanto al seleccionar de galería como al subir nuevo
- Los previews de imágenes se limpian automáticamente con `URL.revokeObjectURL()`
- La URL del asset seleccionado se carga automáticamente usando `useAssetUrl`

## 🧪 Testing

Ejemplo de test:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AssetSelector } from "./asset-selector";

test("muestra galería y permite seleccionar asset", async () => {
  const mockOnAssetSelected = vi.fn();

  render(
    <AssetSelector
      name="assetId"
      userId="user-123"
      onAssetSelected={mockOnAssetSelected}
    />
  );

  // Verificar que se muestra la galería
  await waitFor(() => {
    expect(screen.getByText("Galería")).toBeInTheDocument();
  });

  // Seleccionar un asset (simulado)
  const assetCard = screen.getByText("imagen1.jpg");
  await userEvent.click(assetCard);

  // Verificar callback
  expect(mockOnAssetSelected).toHaveBeenCalledWith("asset-123");
});
```

## 📚 Archivos Relacionados

- `@/hooks/use-assets.ts`: Hook para cargar y subir assets
- `@/hooks/use-asset-url.ts`: Hook para obtener URLs de assets
- `@/components/ui/form.tsx`: Componentes de formulario
- `@/components/assets/asset-gallery.tsx`: Galería de assets completa

## 🤝 Contribución

Para extender este componente:

1. Agregar nuevos tipos de assets en `@/hooks/use-assets.ts`
2. Actualizar el componente `AssetSelector` para manejar nuevos tipos
3. Agregar nuevos ejemplos en `asset-selector.examples.tsx`
