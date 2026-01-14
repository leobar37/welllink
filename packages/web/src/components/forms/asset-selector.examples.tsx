/**
 * EJEMPLO DE USO DE ASSETSELECTOR
 *
 * Este archivo muestra cómo usar el componente AssetSelector en diferentes contextos.
 */

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AssetSelector } from "@/components/forms/asset-selector";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// =============================================================================
// EJEMPLO 1: Selección de Avatar (Opcional)
// =============================================================================

const profileFormSchema = z.object({
  displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  avatarId: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

function ProfileFormExample() {
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: "",
      avatarId: "",
    },
  });

  const onSubmit = (data: ProfileFormValues) => {
    console.log("Formulario enviado:", data);
  };

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Editar Perfil</CardTitle>
          <CardDescription>
            Actualiza la información de tu perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Selector de avatar - opcional */}
            <AssetSelector
              name="avatarId"
              label="Foto de Perfil"
              description="Selecciona una imagen para tu avatar"
              type="avatar"
              userId="user-123"
              onAssetSelected={(assetId) => console.log("Avatar seleccionado:", assetId)}
            />

            <Button type="submit">Guardar Cambios</Button>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

// =============================================================================
// EJEMPLO 2: Selección de Imagen de Portada (Requerido)
// =============================================================================

const themeFormSchema = z.object({
  coverId: z.string().min(1, "Debes seleccionar una imagen de portada"),
  primaryColor: z.string().min(7, "Color inválido"),
});

type ThemeFormValues = z.infer<typeof themeFormSchema>;

function ThemeFormExample() {
  const form = useForm<ThemeFormValues>({
    resolver: zodResolver(themeFormSchema),
    defaultValues: {
      coverId: "",
      primaryColor: "#3b82f6",
    },
  });

  const onSubmit = (data: ThemeFormValues) => {
    console.log("Tema guardado:", data);
  };

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Personalizar Tema</CardTitle>
          <CardDescription>
            Configura la apariencia de tu perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Selector de imagen de portada - requerido */}
            <AssetSelector
              name="coverId"
              label="Imagen de Portada"
              description="Esta imagen se mostrará en la parte superior de tu perfil"
              type="cover"
              required
              userId="user-123"
              onAssetSelected={(assetId) => console.log("Cover seleccionado:", assetId)}
            />

            <Button type="submit">Guardar Tema</Button>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

// =============================================================================
// EJEMPLO 3: Selector de Documentos (PDF)
// =============================================================================

const documentFormSchema = z.object({
  documentId: z.string().min(1, "Debes subir un documento"),
  title: z.string().min(1, "El título es requerido"),
});

type DocumentFormValues = z.infer<typeof documentFormSchema>;

function DocumentFormExample() {
  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: {
      documentId: "",
      title: "",
    },
  });

  const onSubmit = (data: DocumentFormValues) => {
    console.log("Documento subido:", data);
  };

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Subir Documento</CardTitle>
          <CardDescription>
            Comparte un documento con tus clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Selector de documento - solo acepta PDFs */}
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
              onAssetSelected={(assetId) => console.log("Documento seleccionado:", assetId)}
            />

            <Button type="submit">Subir Documento</Button>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

// =============================================================================
// EJEMPLO 4: Selector Genérico (Sin filtro de tipo)
// =============================================================================

const genericFormSchema = z.object({
  assetId: z.string().optional(),
});

type GenericFormValues = z.infer<typeof genericFormSchema>;

function GenericAssetSelectorExample() {
  const form = useForm<GenericFormValues>({
    resolver: zodResolver(genericFormSchema),
    defaultValues: {
      assetId: "",
    },
  });

  const onSubmit = (data: GenericFormValues) => {
    console.log("Asset seleccionado:", data);
  };

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Archivo</CardTitle>
          <CardDescription>
            Elige cualquier archivo de tu galería
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Selector genérico - muestra todos los tipos de archivos */}
            <AssetSelector
              name="assetId"
              label="Archivo"
              description="Selecciona cualquier archivo de tu galería o sube uno nuevo"
              userId="user-123"
              onAssetSelected={(assetId) => console.log("Asset seleccionado:", assetId)}
            />

            <Button type="submit">Continuar</Button>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

// =============================================================================
// EJEMPLO 5: Múltiples Selectores de Assets
// =============================================================================

const multiAssetFormSchema = z.object({
  avatarId: z.string().optional(),
  coverId: z.string().optional(),
  galleryImageId: z.string().optional(),
});

type MultiAssetFormValues = z.infer<typeof multiAssetFormSchema>;

function MultiAssetSelectorExample() {
  const form = useForm<MultiAssetFormValues>({
    resolver: zodResolver(multiAssetFormSchema),
    defaultValues: {
      avatarId: "",
      coverId: "",
      galleryImageId: "",
    },
  });

  const onSubmit = (data: MultiAssetFormValues) => {
    console.log("Assets seleccionados:", data);
  };

  return (
    <FormProvider {...form}>
      <Card>
        <CardHeader>
          <CardTitle>Gestionar Archivos</CardTitle>
          <CardDescription>
            Selecciona diferentes tipos de imágenes para tu perfil
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Avatar */}
            <AssetSelector
              name="avatarId"
              label="Avatar"
              description="Tu foto de perfil"
              type="avatar"
              userId="user-123"
            />

            {/* Cover */}
            <AssetSelector
              name="coverId"
              label="Imagen de Portada"
              description="Imagen de fondo del perfil"
              type="cover"
              userId="user-123"
            />

            {/* Galería */}
            <AssetSelector
              name="galleryImageId"
              label="Imagen de Galería"
              description="Imágenes para tu galería pública"
              type="image"
              userId="user-123"
            />

            <Button type="submit">Guardar Todo</Button>
          </form>
        </CardContent>
      </Card>
    </FormProvider>
  );
}

export {
  ProfileFormExample,
  ThemeFormExample,
  DocumentFormExample,
  GenericAssetSelectorExample,
  MultiAssetSelectorExample,
};
