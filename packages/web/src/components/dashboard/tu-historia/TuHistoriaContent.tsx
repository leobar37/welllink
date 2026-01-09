import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ResponsiveDrawerSheet } from "@/components/ui/responsive-drawer-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Image as ImageIcon,
  Loader2,
  Plus,
  Trash2,
  Wand2,
} from "lucide-react";
import { api } from "@/lib/api";
import type { TuHistoriaSection, TuHistoriaStory } from "@/lib/types";
import { getAssetPublicUrl } from "@/lib/tu-historia";
import { useAssetUrl } from "@/hooks/use-asset-url";

const sectionSchema = z.object({
  ctaLabel: z
    .string()
    .max(120, "Máximo 120 caracteres")
    .optional()
    .or(z.literal("")),
});

const storySchema = z.object({
  title: z
    .string()
    .min(1, "El título es obligatorio")
    .max(160, "Máximo 160 caracteres"),
  type: z.enum(["self", "client"]),
  beforeAssetId: z.string().min(1, "Necesitas una imagen del antes"),
  afterAssetId: z.string().min(1, "Necesitas una imagen del después"),
  text: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .optional()
    .or(z.literal("")),
  isPublished: z.boolean().optional(),
});

type SectionFormValues = z.infer<typeof sectionSchema>;
type StoryFormValues = z.infer<typeof storySchema>;

interface TuHistoriaContentProps {
  profileId?: string;
  profile?: { whatsappNumber?: string };
  buttonText: string;
  onUpdateButtonText: (text: string) => Promise<void>;
  isSavingButtonText?: boolean;
}

interface DashboardStoriesResponse {
  section: TuHistoriaSection;
  stories: TuHistoriaStory[];
}

export function TuHistoriaContent({
  profileId,
  profile,
}: TuHistoriaContentProps) {
  const queryClient = useQueryClient();
  const [storyDialogOpen, setStoryDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<TuHistoriaStory | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["tu-historia", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await api.stories.profile[profileId].get();
      if (error) throw error;
      return data as unknown as DashboardStoriesResponse;
    },
    enabled: !!profileId,
  });

  const { data: metrics } = useQuery({
    queryKey: ["tu-historia-metrics", profileId],
    queryFn: async () => {
      if (!profileId) return null;
      const { data, error } = await api.stories.profile[
        profileId
      ].metrics.get({
        $query: { days: "30" },
      });
      if (error) throw error;
      return data as unknown as {
        counts: Record<string, number>;
      };
    },
    enabled: !!profileId,
  });

  const stories = useMemo(() => {
    return (data?.stories ?? []).slice().sort((a, b) => a.order - b.order);
  }, [data?.stories]);

  const sectionForm = useForm<SectionFormValues>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      ctaLabel: "Agenda una llamada",
    },
  });

  useEffect(() => {
    if (data?.section) {
      sectionForm.reset({
        ctaLabel: data.section.ctaLabel || "",
      });
    }
  }, [data?.section, sectionForm]);

  // Helper function to generate WhatsApp URL from profile
  const generateWhatsAppUrl = (): string => {
    if (!profile?.whatsappNumber) return "";

    // Clean the phone number and create WhatsApp link
    const cleanPhone = profile.whatsappNumber.replace(/[^\d+]/g, "");
    if (cleanPhone.startsWith("+")) {
      return `https://wa.me/${cleanPhone.replace("+", "")}`;
    }
    return `https://wa.me/${cleanPhone}`;
  };

  const sectionMutation = useMutation({
    mutationFn: async (formValues: SectionFormValues) => {
      if (!profileId) throw new Error("Sin perfil");

      // Generate WhatsApp URL from profile
      const whatsappUrl = generateWhatsAppUrl();

      const payload = {
        title: "Mi historia",
        intro: null,
        ctaLabel: formValues.ctaLabel || null,
        ctaUrl: whatsappUrl || null,
      };
      const { data, error } =
        await api.stories.profile[profileId].config.put(payload);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Configuración guardada");
      queryClient.invalidateQueries({ queryKey: ["tu-historia", profileId] });
    },
    onError: () => toast.error("No pudimos guardar los cambios"),
  });

  const createStoryMutation = useMutation({
    mutationFn: async (values: StoryFormValues) => {
      if (!profileId) throw new Error("Sin perfil");
      const { data, error } = await api.stories.profile[profileId].post({
        ...values,
        text: values.text || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Historia creada");
      queryClient.invalidateQueries({ queryKey: ["tu-historia", profileId] });
      setStoryDialogOpen(false);
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error("No pudimos guardar la historia");
    },
  });

  const updateStoryMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: StoryFormValues;
    }) => {
      const { data, error } = await api.stories[id].put({
        ...values,
        text: values.text || undefined,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Historia actualizada");
      queryClient.invalidateQueries({ queryKey: ["tu-historia", profileId] });
      setStoryDialogOpen(false);
    },
    onError: () => toast.error("No pudimos actualizar la historia"),
  });

  const deleteStoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await api.stories[id].delete();
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Historia eliminada");
      queryClient.invalidateQueries({ queryKey: ["tu-historia", profileId] });
    },
    onError: () => toast.error("No pudimos eliminar la historia"),
  });

  const publishStoryMutation = useMutation({
    mutationFn: async ({
      id,
      isPublished,
    }: {
      id: string;
      isPublished: boolean;
    }) => {
      const { data, error } = await api.stories[id].publish.patch({
        isPublished,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.isPublished ? "Historia publicada" : "Historia ocultada",
      );
      queryClient.invalidateQueries({ queryKey: ["tu-historia", profileId] });
    },
    onError: (error: unknown) => {
      console.error(error);
      toast.error("No pudimos actualizar el estado");
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (items: Array<{ id: string; order: number }>) => {
      if (!profileId) throw new Error("Sin perfil");
      const { error } = await api.stories.reorder.patch({
        profileId,
        items,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tu-historia", profileId] });
    },
    onError: () => toast.error("No pudimos reordenar"),
  });

  const handleReorder = (id: string, direction: -1 | 1) => {
    const ordered = stories.slice().sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((story) => story.id === id);
    if (index === -1) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= ordered.length) return;
    const tmp = ordered[index];
    ordered[index] = ordered[targetIndex];
    ordered[targetIndex] = tmp;
    reorderMutation.mutate(
      ordered.map((story, idx) => ({ id: story.id, order: idx })),
    );
  };

  const openCreateDialog = () => {
    setEditingStory(null);
    setStoryDialogOpen(true);
  };

  const openEditDialog = (story: TuHistoriaStory) => {
    setEditingStory(story);
    setStoryDialogOpen(true);
  };

  const handleStorySubmit = (values: StoryFormValues) => {
    if (editingStory) {
      updateStoryMutation.mutate({ id: editingStory.id, values });
    } else {
      createStoryMutation.mutate(values);
    }
  };

  const handleDeleteStory = (story: TuHistoriaStory) => {
    if (!window.confirm("¿Eliminar esta historia?")) return;
    deleteStoryMutation.mutate(story.id);
  };

  const handlePublishToggle = (story: TuHistoriaStory) => {
    publishStoryMutation.mutate({
      id: story.id,
      isPublished: !story.isPublished,
    });
  };

  
  const sectionLoading = sectionMutation.isPending;
  const storySaving =
    createStoryMutation.isPending || updateStoryMutation.isPending;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Configuración</h3>
          <p className="text-sm text-muted-foreground">
            Personaliza el texto del botón WhatsApp. Se usará automáticamente tu número configurado.
          </p>
        </div>
        <form
          className="grid gap-4"
          onSubmit={sectionForm.handleSubmit((values) =>
            sectionMutation.mutate(values),
          )}
        >
          <div className="grid gap-2">
            <Label htmlFor="ctaLabel">Texto del botón WhatsApp</Label>
            <Input
              id="ctaLabel"
              placeholder="Agenda una llamada"
              disabled={sectionLoading}
              {...sectionForm.register("ctaLabel")}
            />
            {sectionForm.formState.errors.ctaLabel && (
              <p className="text-sm text-destructive">
                {sectionForm.formState.errors.ctaLabel.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Este texto aparecerá en el botón que conecta con tu WhatsApp.
            </p>
          </div>
          {profile?.whatsappNumber && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-green-700">
                WhatsApp configurado: {profile.whatsappNumber}
              </span>
            </div>
          )}
          {!profile?.whatsappNumber && (
            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="h-2 w-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-700">
                Configura tu WhatsApp en tu perfil para activar el CTA
              </span>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="submit"
              disabled={sectionLoading || !sectionForm.formState.isDirty}
            >
              {sectionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Guardar
            </Button>
          </div>
        </form>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold">Historias</h3>
            <p className="text-sm text-muted-foreground">
              Puedes publicar hasta 3 historias. Prioriza imágenes verticales.
            </p>
          </div>
          <Button onClick={openCreateDialog} disabled={stories.length >= 3}>
            <Plus className="mr-2 h-4 w-4" /> Agregar historia
          </Button>
        </div>
        <div className="space-y-3">
          {stories.length === 0 && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">
                  Aún no tienes historias
                </CardTitle>
                <CardDescription>
                  Sube tu transformación o la de tus clientes para inspirar
                  confianza.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {stories.map((story, index) => (
            <StoryRow
              key={story.id}
              story={story}
              index={index}
              total={stories.length}
              onEdit={() => openEditDialog(story)}
              onDelete={() => handleDeleteStory(story)}
              onPublish={() => handlePublishToggle(story)}
              onMove={(direction) => handleReorder(story.id, direction)}
              disabled={
                reorderMutation.isPending || deleteStoryMutation.isPending
              }
            />
          ))}
        </div>
      </section>

      {metrics?.counts && (
        <section className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
          <MetricsCard
            label="Vistas (30 días)"
            value={metrics.counts.section_viewed || 0}
            helper="Cuántas personas abrieron la sección"
          />
          <MetricsCard
            label="Clicks del CTA"
            value={metrics.counts.cta_clicked || 0}
            helper="Veces que pulsaron tu botón final"
          />
        </section>
      )}

      <ResponsiveDrawerSheet
        open={storyDialogOpen}
        onOpenChange={(next) => {
          setStoryDialogOpen(next);
          if (!next) setEditingStory(null);
        }}
        title={editingStory ? "Editar historia" : "Nueva historia"}
        description="Completa la información y sube las imágenes del antes y después."
      >
        <StoryFormContent
          defaultValues={editingStory}
          isSubmitting={storySaving}
          onSubmit={handleStorySubmit}
          onCancel={() => setStoryDialogOpen(false)}
        />
      </ResponsiveDrawerSheet>
    </div>
  );
}

interface StoryRowProps {
  story: TuHistoriaStory;
  index: number;
  total: number;
  onEdit: () => void;
  onDelete: () => void;
  onPublish: () => void;
  onMove: (direction: -1 | 1) => void;
  disabled?: boolean;
}

function StoryRow({
  story,
  index,
  total,
  onEdit,
  onDelete,
  onPublish,
  onMove,
  disabled,
}: StoryRowProps) {
  const { data: beforeUrl } = useAssetUrl(story.beforeAssetId);
  const { data: afterUrl } = useAssetUrl(story.afterAssetId);

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg bg-muted">
            {beforeUrl ? (
              <img
                src={beforeUrl}
                alt="Antes"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <ImageIcon className="h-full w-full p-4 text-muted-foreground" />
            )}
            {afterUrl && (
              <img
                src={afterUrl}
                alt="Después"
                className="absolute inset-0 h-full w-full object-cover opacity-0"
              />
            )}
          </div>
          <div>
            <h4 className="font-semibold">{story.title}</h4>
            <p className="text-sm text-muted-foreground">
              {story.type === "self" ? "Historia personal" : "Caso de cliente"}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant={story.isPublished ? "default" : "secondary"}>
                {story.isPublished ? "Publicada" : "Oculta"}
              </Badge>
              <Badge variant="outline">Bloque #{index + 1}</Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(-1)}
            disabled={index === 0 || disabled}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMove(1)}
            disabled={index === total - 1 || disabled}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit3 className="mr-2 h-4 w-4" /> Editar
          </Button>
          <Button
            variant={story.isPublished ? "secondary" : "default"}
            size="sm"
            onClick={onPublish}
          >
            <Wand2 className="mr-2 h-4 w-4" />
            {story.isPublished ? "Ocultar" : "Publicar"}
          </Button>
          <Button
            variant="destructive"
            size="icon"
            onClick={onDelete}
            disabled={disabled}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface StoryFormContentProps {
  defaultValues: TuHistoriaStory | null;
  onSubmit: (values: StoryFormValues) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

function StoryFormContent({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: StoryFormContentProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: defaultValues
      ? {
          title: defaultValues.title,
          type: defaultValues.type,
          beforeAssetId: defaultValues.beforeAssetId,
          afterAssetId: defaultValues.afterAssetId,
          text: defaultValues.text || "",
          isPublished: defaultValues.isPublished,
        }
      : {
          title: "",
          type: "self",
          beforeAssetId: "",
          afterAssetId: "",
          text: "",
          isPublished: false,
        },
  });

  useEffect(() => {
    if (defaultValues) {
      reset({
        title: defaultValues.title,
        type: defaultValues.type,
        beforeAssetId: defaultValues.beforeAssetId,
        afterAssetId: defaultValues.afterAssetId,
        text: defaultValues.text || "",
        isPublished: defaultValues.isPublished,
      });
    } else {
      reset({
        title: "",
        type: "self",
        beforeAssetId: "",
        afterAssetId: "",
        text: "",
        isPublished: false,
      });
    }
  }, [defaultValues, reset]);

  const beforeAssetId = watch("beforeAssetId");
  const afterAssetId = watch("afterAssetId");

  return (
    <form className="space-y-4 pb-4" onSubmit={handleSubmit((values) => onSubmit(values))}>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            placeholder="De cansada todo el día a con energía"
            disabled={isSubmitting}
            {...register("title")}
          />
          {errors.title && (
            <p className="text-sm text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Tipo de historia</Label>
          <Select
            value={watch("type")}
            onValueChange={(value) =>
              setValue("type", value as "self" | "client")
            }
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="self">Mi propia historia</SelectItem>
              <SelectItem value="client">Historia de cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ImageUploadField
          label="Imagen del antes"
          value={beforeAssetId}
          onChange={(value) =>
            setValue("beforeAssetId", value, { shouldValidate: true })
          }
          disabled={isSubmitting}
        />
        <ImageUploadField
          label="Imagen del después"
          value={afterAssetId}
          onChange={(value) =>
            setValue("afterAssetId", value, { shouldValidate: true })
          }
          disabled={isSubmitting}
        />
      </div>
      {(errors.beforeAssetId || errors.afterAssetId) && (
        <p className="text-sm text-destructive">
          {errors.beforeAssetId?.message || errors.afterAssetId?.message}
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="text">Historia (opcional)</Label>
        <Textarea
          id="text"
          placeholder="Resume el antes y después en pocas líneas"
          className="min-h-32"
          disabled={isSubmitting}
          {...register("text")}
        />
        {errors.text && (
          <p className="text-sm text-destructive">{errors.text.message}</p>
        )}
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Publicar al guardar</p>
          <p className="text-xs text-muted-foreground">
            Puedes publicar más tarde desde la lista.
          </p>
        </div>
        <Switch
          checked={watch("isPublished") ?? false}
          onCheckedChange={(checked) => setValue("isPublished", checked)}
          disabled={isSubmitting}
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Guardar historia
        </Button>
      </div>
    </form>
  );
}

interface ImageUploadFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

function ImageUploadField({
  label,
  value,
  onChange,
  disabled,
}: ImageUploadFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [assetUrl, setAssetUrl] = useState<string | null>(null);
  const { data: existingUrl } = useAssetUrl(value);
  const previewUrl = assetUrl || existingUrl;

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { data, error } = await api.upload.post({
        file,
        type: "story-image",
      });
      if (error) throw error;
      if (data?.id) {
        onChange(data.id as string);
        setAssetUrl(data.url || null);
        toast.success("Imagen subida");
      }
    } catch (err) {
      console.error(err);
      toast.error("No se pudo subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="relative flex h-40 w-full flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={label}
            className="absolute inset-0 h-full w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex flex-col items-center text-center text-sm text-muted-foreground">
            <ImageIcon className="mb-2 h-6 w-6" />
            Sube una imagen
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-background/70 opacity-0 transition-opacity hover:opacity-100">
          <Button size="sm" type="button" disabled={uploading || disabled}>
            {uploading ? "Subiendo..." : "Seleccionar"}
          </Button>
        </div>
        <input
          type="file"
          accept="image/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleUpload}
          disabled={uploading || disabled}
        />
      </div>
    </label>
  );
}

interface MetricsCardProps {
  label: string;
  value: number;
  helper: string;
}

function MetricsCard({ label, value, helper }: MetricsCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}