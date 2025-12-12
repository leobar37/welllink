import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, QrCode, Smartphone, Wifi, AlertCircle, CheckCircle2 } from "lucide-react";
import { useWhatsApp } from "@/hooks/use-whatsapp";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const whatsappConfigSchema = z.object({
  buttonText: z
    .string()
    .min(1, "El texto del botón es requerido")
    .max(100, "El texto no puede exceder 100 caracteres"),
});

type WhatsAppConfigForm = z.infer<typeof whatsappConfigSchema>;

interface WhatsAppConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: {
    buttonText?: string;
  };
  onSave: (data: WhatsAppConfigForm) => Promise<void>;
  isLoading?: boolean;
}

export function WhatsAppConfigModal({
  open,
  onOpenChange,
  defaultValues,
  onSave,
  isLoading = false,
}: WhatsAppConfigModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<WhatsAppConfigForm>({
    resolver: zodResolver(whatsappConfigSchema),
    defaultValues: {
      buttonText: defaultValues?.buttonText || "Escríbeme por WhatsApp",
    },
  });

  const { config, connect, disconnect, refreshStatus, isLoading: connectionLoading } = useWhatsApp();

  const onSubmit = async (data: WhatsAppConfigForm) => {
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
    await connect();
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleRefresh = async () => {
    await refreshStatus();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={handleOpenChange}
      title="Configurar WhatsApp"
      description="Conecta tu cuenta de WhatsApp Business para enviar mensajes a tus clientes"
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
            {config.isConnected ? (
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">Conectado</p>
                    <p className="text-sm text-green-700">
                      Tu cuenta de WhatsApp Business está conectada
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={connectionLoading}
                >
                  {connectionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="mr-2 h-4 w-4" />
                  )}
                  Desconectar
                </Button>
              </div>
            ) : config.qrCode ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <QrCode className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm font-medium text-yellow-900">
                      Escanea el código QR
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={connectionLoading}
                  >
                    {connectionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Refrescar"
                    )}
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
                  Escanea este código con la app de WhatsApp Business para conectar tu cuenta
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Wifi className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">No conectado</p>
                    <p className="text-sm text-gray-600">
                      Conecta tu cuenta de WhatsApp Business para empezar
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleConnect}
                  disabled={connectionLoading}
                >
                  {connectionLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Smartphone className="mr-2 h-4 w-4" />
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
              Personaliza el texto que aparece en el botón de WhatsApp en tu perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="buttonText">Texto del botón</Label>
              <div className="relative">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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