import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  QrCode,
  Smartphone,
  Wifi,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import { useWhatsApp } from "@/hooks/use-whatsapp";

export function WhatsApp() {
  const {
    config,
    configs,
    connect,
    disconnect,
    refreshStatus,
    refreshConfigs,
    isLoading: connectionLoading,
  } = useWhatsApp();

  const activeConfigId = config.configId || configs[0]?.id;

  useEffect(() => {
    if (
      activeConfigId &&
      !config.isConnected &&
      !config.qrCode &&
      !connectionLoading &&
      configs.length > 0
    ) {
      connect(activeConfigId);
    }
  }, [
    activeConfigId,
    config.isConnected,
    config.qrCode,
    connectionLoading,
    configs.length,
  ]);

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

  const hasNoConfigs =
    configs.length === 0 && !config.configId && !connectionLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WhatsApp Business</h1>
        <p className="text-muted-foreground">
          Conecta tu cuenta de WhatsApp Business para enviar mensajes a tus
          clientes
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Estado de Conexión</CardTitle>
          <CardDescription>
            Gestiona la conexión de tu cuenta de WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {connectionLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="flex items-center space-x-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <div>
                  <p className="font-medium text-gray-900">
                    Configurando WhatsApp
                  </p>
                  <p className="text-sm text-gray-600">
                    Creando tu instancia de WhatsApp Business...
                  </p>
                </div>
              </div>
            </div>
          ) : hasNoConfigs ? (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
              <Smartphone className="h-12 w-12 text-gray-400 mb-4" />
              <div className="text-center space-y-2 mb-6">
                <p className="font-medium text-gray-900">
                  No tienes WhatsApp configurado
                </p>
                <p className="text-sm text-gray-600">
                  Crea tu instancia para comenzar a enviar mensajes
                </p>
              </div>
              <Button
                type="button"
                onClick={refreshConfigs}
                disabled={connectionLoading}
                className="w-full sm:w-auto"
              >
                {connectionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando configuración...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Crear Configuración
                  </>
                )}
              </Button>
            </div>
          ) : config.isConnected ? (
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
                type="button"
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
                <Wifi className="h-5 w-5 text-gray-400" />
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
    </div>
  );
}
