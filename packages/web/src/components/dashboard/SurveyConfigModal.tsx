import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

const surveyConfigSchema = z.object({
  buttonText: z
    .string()
    .min(1, "El texto del botón es requerido")
    .max(100, "El texto no puede exceder 100 caracteres"),
});

type SurveyConfigForm = z.infer<typeof surveyConfigSchema>;

interface SurveyConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    buttonText?: string;
  };
  onSave: (data: SurveyConfigForm) => Promise<void>;
  isLoading?: boolean;
}

export function SurveyConfigModal({
  open,
  onOpenChange,
  defaultValues,
  onSave,
  isLoading = false,
}: SurveyConfigModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<SurveyConfigForm>({
    resolver: zodResolver(surveyConfigSchema),
    defaultValues: {
      buttonText: defaultValues?.buttonText || "Evalúate gratis",
    },
  });

  const onSubmit = async (data: SurveyConfigForm) => {
    await onSave(data);
    onOpenChange(false);
  };

  // Reset form when modal opens with new defaults
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      reset({
        buttonText: defaultValues?.buttonText || "Evalúate gratis",
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Configurar Encuesta de Salud"
      description="Personaliza cómo se muestra la encuesta en tu perfil"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="buttonText">Texto del botón</Label>
          <Input
            id="buttonText"
            placeholder="Evalúate gratis"
            {...register("buttonText")}
            disabled={isSubmitting || isLoading}
          />
          {errors.buttonText && (
            <p className="text-sm text-destructive">
              {errors.buttonText.message}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Este texto aparece en el botón de tu perfil público
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting || isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </form>
    </ResponsiveDialog>
  );
}
