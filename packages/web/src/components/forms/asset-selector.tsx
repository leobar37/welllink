import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useDropzone } from "react-dropzone";
import type { FieldPath, FieldValues } from "react-hook-form";
import {
  useAssets,
  useAssetUrl,
  type Asset,
  type AssetType,
} from "@/hooks/use-assets";
import { cn } from "@/lib/utils";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  Check,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

interface AssetSelectorProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  label?: string;
  description?: string;
  type?: AssetType;
  required?: boolean;
  onAssetSelected?: (assetId: string) => void;
  userId?: string;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
}

// Configuración por defecto para aceptar archivos
const DEFAULT_ACCEPT: Record<string, string[]> = {
  "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
  "application/pdf": [".pdf"],
};

// Determinar si es una imagen por mimeType
function isImageAsset(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

// Obtener icono según tipo de archivo
function getFileIcon(asset: Asset) {
  if (isImageAsset(asset.mimeType)) {
    return <ImageIcon className="h-8 w-8 text-muted-foreground" />;
  }
  return <FileText className="h-8 w-8 text-muted-foreground" />;
}

// Formatear tamaño en bytes a KB/MB
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AssetSelector<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  name,
  label = "Seleccionar Archivo",
  description,
  type,
  required = false,
  onAssetSelected,
  userId,
  maxSize = 5 * 1024 * 1024, // 5MB por defecto
  accept = DEFAULT_ACCEPT,
}: AssetSelectorProps<TFieldValues, TName>) {
  const form = useFormContext<TFieldValues>();

  // Obtener el valor del formulario usando watch
  const selectedAssetId = (form.watch(name) as string | undefined) || null;
  const { data: selectedAssetUrl } = useAssetUrl(selectedAssetId);

  // Debug: Verificar el asset seleccionado
  // console.log("AssetSelector - selectedAssetId:", selectedAssetId);
  // console.log("AssetSelector - selectedAssetUrl:", selectedAssetUrl);

  const { assets, isLoading, uploadAsset, getAssetsByType } = useAssets(userId);
  const { data: typedAssets } = getAssetsByType(type || "image");

  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState<string | null>(null);

  // Usar assets filtrados por tipo si se especificó, de lo contrario usar todos
  const availableAssets = type ? typedAssets : assets;

  // Debug: Verificar qué estamos usando
  // console.log("AssetSelector - availableAssets:", availableAssets);
  // console.log("AssetSelector - assets have URLs?", availableAssets?.some(a => !!a.url));

  // Configuración de dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept,
    maxSize,
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploadingFile(file);
      setUploadingFileName(file.name);

      // Crear preview solo para imágenes
      if (file.type.startsWith("image/")) {
        const preview = URL.createObjectURL(file);
        setUploadPreview(preview);
      }

      // Subir el archivo
      try {
        const uploadedAsset = await uploadAsset.mutateAsync({
          file,
          type: type || "image",
        });

        // Actualizar el valor del formulario
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.setValue(name, uploadedAsset.id as any);
        onAssetSelected?.(uploadedAsset.id);

        toast.success("Archivo subido exitosamente");

        // Limpiar preview
        if (uploadPreview) {
          URL.revokeObjectURL(uploadPreview);
        }
        setUploadPreview(null);
        setUploadingFile(null);
        setUploadingFileName(null);
      } catch {
        toast.error("Error al subir el archivo");
        setUploadPreview(null);
        setUploadingFile(null);
        setUploadingFileName(null);
      }
    },
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.flatMap((file) =>
        file.errors.map((err) => err.message)
      );
      toast.error(errors.join(", "));
    },
  });

  // Manejar selección de asset existente
  const handleSelectAsset = (assetId: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue(name, assetId as any);
    onAssetSelected?.(assetId);
  };

  // Manejar eliminación de asset seleccionado
  const handleClearSelection = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    form.setValue(name, "" as any);
  };

  // Encontrar el asset seleccionado
  const selectedAsset = availableAssets?.find(
    (asset) => asset.id === selectedAssetId
  );

  // Estado de carga
  const isUploading = uploadAsset.isPending || !!uploadingFile;

  return (
    <FormField
      control={form.control}
      name={name}
      render={() => (
        <FormItem className="space-y-3">
          {label && (
            <FormLabel>
              {label}
              {required && <span className="text-destructive ml-1">*</span>}
            </FormLabel>
          )}

          <FormControl>
            <div className="space-y-4">
              {/* Preview del asset seleccionado */}
              {selectedAssetId && (
                <Card className="border-primary/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Preview de imagen o icono */}
                      <div className="flex-shrink-0">
                        {selectedAsset && selectedAsset.url ? (
                          <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                            {isImageAsset(selectedAsset.mimeType) ? (
                              <img
                                src={selectedAsset.url}
                                alt={selectedAsset.filename}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {getFileIcon(selectedAsset)}
                              </div>
                            )}
                          </div>
                        ) : selectedAssetUrl ? (
                          <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                            <img
                              src={selectedAssetUrl}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info del archivo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {selectedAsset?.filename || "Archivo seleccionado"}
                          </p>
                          <Badge variant="outline" className="shrink-0">
                            <Check className="h-3 w-3 mr-1" />
                            Seleccionado
                          </Badge>
                        </div>
                        {selectedAsset && (
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(selectedAsset.size)}
                          </p>
                        )}
                      </div>

                      {/* Botón de eliminar */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={handleClearSelection}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs para seleccionar o subir */}
              <Card>
                <CardHeader className="pb-3">
                  {description && <CardDescription>{description}</CardDescription>}
                </CardHeader>
                <CardContent className="pt-0">
                  <Tabs defaultValue="gallery" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-4">
                      <TabsTrigger value="gallery">
                        <FileText className="h-4 w-4 mr-2" />
                        Galería
                      </TabsTrigger>
                      <TabsTrigger value="upload">
                        <Upload className="h-4 w-4 mr-2" />
                        Subir Nuevo
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab de galería */}
                    <TabsContent value="gallery" className="space-y-4">
                      {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Spinner />
                        </div>
                      ) : availableAssets && availableAssets.length > 0 ? (
                        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                          {availableAssets.map((asset) => (
                            <Card
                              key={asset.id}
                              className={cn(
                                "overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                                selectedAssetId === asset.id &&
                                  "ring-2 ring-primary"
                              )}
                              onClick={() => handleSelectAsset(asset.id)}
                            >
                              <CardContent className="p-2">
                                <div className="space-y-2">
                                  {/* Preview */}
                                  <div className="aspect-square rounded-md bg-muted/50 flex items-center justify-center overflow-hidden">
                                    {isImageAsset(asset.mimeType) && asset.url ? (
                                      <img
                                        src={asset.url}
                                        alt={asset.filename}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center">
                                        {isImageAsset(asset.mimeType) ? (
                                          <div className="text-xs text-muted-foreground text-center px-2">
                                            Sin URL
                                          </div>
                                        ) : (
                                          getFileIcon(asset)
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Nombre del archivo */}
                                  <p className="text-xs truncate text-center">
                                    {asset.filename}
                                  </p>

                                  {/* Indicador de selección */}
                                  {selectedAssetId === asset.id && (
                                    <div className="absolute top-2 right-2">
                                      <div className="bg-primary text-primary-foreground rounded-full p-1">
                                        <Check className="h-3 w-3" />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <Card className="border-dashed">
                          <CardContent className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                            <p className="text-sm text-muted-foreground text-center">
                              No hay archivos disponibles en la galería
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Sube un nuevo archivo para continuar
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>

                    {/* Tab de upload */}
                    <TabsContent value="upload">
                      <div
                        {...getRootProps()}
                        className={cn(
                          "border-2 border-dashed rounded-lg p-8 transition-colors cursor-pointer",
                          isDragActive
                            ? "border-primary bg-primary/5"
                            : "border-input hover:border-primary/50 hover:bg-muted/30"
                        )}
                      >
                        <input {...getInputProps()} />

                        {isUploading ? (
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <Spinner />
                            <p className="text-sm text-muted-foreground">
                              Subiendo archivo...
                            </p>
                          </div>
                        ) : uploadPreview ? (
                          <div className="space-y-3">
                            <img
                              src={uploadPreview}
                              alt="Preview"
                              className="w-full max-h-48 object-contain rounded-md mx-auto"
                            />
                            <p className="text-sm text-center text-muted-foreground">
                              {uploadingFileName}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center space-y-3">
                            <Upload className="h-12 w-12 text-muted-foreground" />
                            <div className="text-center">
                              <p className="text-sm font-medium">
                                {isDragActive
                                  ? "Suelta el archivo aquí"
                                  : "Arrastra y suelta un archivo aquí"}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                o haz clic para seleccionar
                              </p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Tamaño máximo: {formatFileSize(maxSize)}
                            </p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/**
 * EJEMPLO DE USO:
 *
 * ```tsx
 * import { useForm } from "react-hook-form";
 * import { zodResolver } from "@hookform/resolvers/zod";
 * import { z } from "zod";
 * import { AssetSelector } from "@/components/forms/asset-selector";
 * import { FormProvider } from "@/components/ui/form";
 * import { Button } from "@/components/ui/button";
 *
 * // Definir el esquema de validación
 * const formSchema = z.object({
 *   avatarId: z.string().min(1, "Debes seleccionar un avatar"),
 *   coverId: z.string().optional(),
 * });
 *
 * type FormValues = z.infer<typeof formSchema>;
 *
 * function ProfileForm() {
 *   const form = useForm<FormValues>({
 *     resolver: zodResolver(formSchema),
 *     defaultValues: {
 *       avatarId: "",
 *       coverId: "",
 *     },
 *   });
 *
 *   const onSubmit = (data: FormValues) => {
 *     console.log("Form submitted:", data);
 *   };
 *
 *   return (
 *     <FormProvider {...form}>
 *       <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
 *         <AssetSelector
 *           name="avatarId"
 *           label="Avatar"
 *           description="Selecciona una imagen para tu perfil"
 *           type="avatar"
 *           required
 *           userId="user-123"
 *           onAssetSelected={(assetId) => console.log("Asset seleccionado:", assetId)}
 *         />
 *
 *         <AssetSelector
 *           name="coverId"
 *           label="Imagen de Portada"
 *           type="cover"
 *           userId="user-123"
 *           maxSize={10 * 1024 * 1024} // 10MB
 *         />
 *
 *         <Button type="submit">Guardar</Button>
 *       </form>
 *     </FormProvider>
 *   );
 * }
 * ```
 */
