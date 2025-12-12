import { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";

interface WhatsAppConfig {
  isConnected: boolean;
  instanceId?: string;
  qrCode?: string;
  error?: string;
}

interface WhatsAppConnectionState {
  config: WhatsAppConfig;
  isLoading: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

export function useWhatsApp(): WhatsAppConnectionState {
  const [config, setConfig] = useState<WhatsAppConfig>({
    isConnected: false,
    instanceId: undefined,
    qrCode: undefined,
    error: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      const response = await new Promise<{ data: any; error: any }>((resolve) => {
        setTimeout(() => {
          resolve({
            data: { isConnected: false, instanceId: "mock-instance", qrCode: "mock-qr-data" },
            error: null,
          });
        }, 100);
      });
      
      if (response.error) {
        setConfig({
          isConnected: false,
          instanceId: undefined,
          qrCode: undefined,
          error: response.error?.message || "Error desconocido",
        });
        return;
      }

      setConfig({
        isConnected: response.data.isConnected,
        instanceId: response.data.instanceId,
        qrCode: response.data.qrCode,
        error: undefined,
      });
    } catch (err: any) {
      console.error("Error fetching WhatsApp config:", err);
      setConfig({
        isConnected: false,
        instanceId: undefined,
        qrCode: undefined,
        error: err?.message || "Error al obtener la configuración de WhatsApp",
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      const response = await new Promise<{ data: any; error: any }>((resolve) => {
        setTimeout(() => {
          resolve({
            data: { isConnected: false, instanceId: "mock-instance", qrCode: "mock-qr-data" },
            error: null,
          });
        }, 100);
      });
      
      if (response.error) {
        toast.error(response.error?.message || "Error al conectar WhatsApp");
        return;
      }

      if (response.data.qrCode) {
        // Generate QR code from the data received
        const qrCodeDataUrl = await QRCode.toDataURL(response.data.qrCode, {
          width: 256,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        });
        
        setConfig({
          isConnected: false,
          instanceId: response.data.instanceId,
          qrCode: qrCodeDataUrl,
          error: undefined,
        });
        
        toast.info("Escanea el código QR con la app de WhatsApp Business");
        
        // Poll for connection status
        const pollInterval = setInterval(async () => {
          try {
            const statusResponse = await new Promise<{ data: any; error: any }>((resolve) => {
              setTimeout(() => {
                resolve({
                  data: { isConnected: true },
                  error: null,
                });
              }, 100);
            });

            if (statusResponse.error) {
              clearInterval(pollInterval);
              return;
            }

            if (statusResponse.data.isConnected) {
              clearInterval(pollInterval);
              setConfig({
                isConnected: true,
                instanceId: response.data.instanceId,
                qrCode: undefined,
                error: undefined,
              });
              toast.success("WhatsApp conectado exitosamente");
            }
          } catch (err) {
            clearInterval(pollInterval);
            console.error("Error polling WhatsApp status:", err);
          }
        }, 3000);

        // Clear interval after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 300000);
      }
    } catch (err: any) {
      console.error("Error connecting WhatsApp:", err);
      toast.error(err?.message || "Error al conectar WhatsApp");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      setIsLoading(true);
      // Simulate API call
      const response = await new Promise<{ error: any }>((resolve) => {
        setTimeout(() => {
          resolve({ error: null });
        }, 100);
      });
      
      if (response.error) {
        toast.error(response.error?.message || "Error al desconectar WhatsApp");
        return;
      }

      setConfig({
        isConnected: false,
        instanceId: undefined,
        qrCode: undefined,
        error: undefined,
      });
      toast.success("WhatsApp desconectado exitosamente");
    } catch (err: any) {
      console.error("Error disconnecting WhatsApp:", err);
      toast.error(err?.message || "Error al desconectar WhatsApp");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    await fetchConfig();
  }, [fetchConfig]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    isLoading,
    connect,
    disconnect,
    refreshStatus,
  };
}