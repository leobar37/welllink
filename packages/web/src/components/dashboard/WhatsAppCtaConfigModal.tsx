import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MessageCircle, RefreshCw, AlertCircle } from "lucide-react";
import { useWhatsApp } from "@/hooks/use-whatsapp";

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

  const {
    config,
    configs,
    connect,
    disconnect,
    refreshStatus,
    isLoading: connectionLoading,
  } = useWhatsApp();

  // Get the first config or the active one
  const activeConfigId = config.configId || configs[0]?.id;

  const onSubmit = async (data: WhatsAppCtaConfigForm) => {
    await onSave(data);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      reset({
        buttonText: defaultValues?.buttonText || "Escríbeme por WhatsApp",
      });
    }
    onOpenChange(newOpen);
  };

  const handleConnect = async () => {
    if (activeConfigId) {
      await connect(activeConfigId);
    }
  };

  const handleDisconnect = async () => {
    if (activeConfigId) {
      await disconnect(activeConfigId);
    }
  };

  const handleRefresh = async () => {
    if (activeConfigId) {
      await refreshStatus(activeConfigId);
    }
  };

  const hasNoConfigs = configs.length === 0 && !config.configId;

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Configurar WhatsApp CTA"
      description="Personaliza el botón de contacto por WhatsApp en tu perfil"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Conexión</CardTitle>
            <CardDescription>
              Gestiona la conexión de tu cuenta de WhatsApp Business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasNoConfigs ? (
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-900">
                      Sin configuración
                    </p>
                    <p className="text-sm text-yellow-700">
                      No tienes una instancia de WhatsApp configurada. Contacta
                      al administrador.
                    </p>
                  </div>
                </div>
              </div>
            ) : config.isConnected ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Conectado</p>
                    <p className="text-sm text-green-700">
                      Tu cuenta de WhatsApp Business está conectada
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={connectionLoading}
                >
                  {connectionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  Desconectar
                </Button>
              </div>
            ) : config.qrCode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-900">
                      Escanea el código QR
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={connectionLoading}
                  >
                    {connectionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-1" />
                    )}
                    Refrescar
                  </Button>
                </div>
                <div className="flex justify-center">
                  <img
                    src={config.qrCode}
                    alt="WhatsApp QR Code"
                    className="w-64 h-64 border-2 border-gray-200 rounded-lg"
                  />
                </div>
                <p className="text-center text-sm text-gray-600">
                  Escanea este código con la app de WhatsApp Business para
                  conectar tu cuenta
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <MessageCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">No conectado</p>
                    <p className="text-sm text-gray-600">
                      Conecta tu cuenta de WhatsApp Business para empezar
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={handleConnect}
                  disabled={connectionLoading || !activeConfigId}
                >
                  {connectionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="mr-2 h-4 w-4" />
                  )}
                  Conectar
                </Button>
              </div>
            )}

            {config.error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700">{config.error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Button Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración del Botón</CardTitle>
            <CardDescription>
              Personaliza el texto que aparece en el botón de WhatsApp en tu
              perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || connectionLoading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={isSubmitting || connectionLoading}
          >
            {isSubmitting || connectionLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
