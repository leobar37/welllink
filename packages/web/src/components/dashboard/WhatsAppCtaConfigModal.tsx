import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle } from "lucide-react";

const whatsappCtaConfigSchema = z.object({
  buttonText: z
    .string()
    .min(1, "El texto del botón es requerido")
    .max(100, "El texto no puede exceder 100 caracteres"),
});

type WhatsAppCtaConfigForm = z.infer<typeof whatsappCtaConfigSchema>;

interface WhatsAppCtaConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    buttonText?: string;
  };
  onSave: (data: WhatsAppCtaConfigForm) => Promise<void>;
  isLoading?: boolean;
}

export function WhatsAppCtaConfigModal({
  open,
  onOpenChange,
  defaultValues,
  onSave,
  isLoading = false,
}: WhatsAppCtaConfigModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WhatsAppCtaConfigForm>({
    resolver: zodResolver(whatsappCtaConfigSchema),
    defaultValues: {
      buttonText: defaultValues?.buttonText || "Escríbeme por WhatsApp",
    },
  });

  const onSubmit = async (data: WhatsAppCtaConfigForm) => {
    await onSave(data);
    onOpenChange(false);
  };

  // Reset form when modal opens with new defaults
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      reset({
        buttonText: defaultValues?.buttonText || "Escríbeme por WhatsApp",
      });
    }
    onOpenChange(newOpen);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Configurar WhatsApp CTA"
      description="Personaliza el botón de contacto por WhatsApp en tu perfil"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="buttonText">Texto del botón</Label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="buttonText"
              placeholder="Escríbeme por WhatsApp"
              className="pl-10"
              {...register("buttonText")}
              disabled={isSubmitting || isLoading}
            />
          </div>
          {errors.buttonText && (
            <p className="text-sm text-destructive">
              {errors.buttonText.message}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Este texto aparece en el botón de llamada a acción de tu perfil
            público. El botón abrirá WhatsApp con tu número configurado.
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
