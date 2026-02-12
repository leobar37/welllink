import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";

const API_URL = import.meta.env.VITE_API_URL || "";

interface WhatsAppConfig {
  isConnected: boolean;
  instanceId?: string;
  qrCode?: string;
  error?: string;
  configId?: string;
}

interface WhatsAppConnectionState {
  config: WhatsAppConfig;
  isLoading: boolean;
  connect: (configId: string) => Promise<void>;
  disconnect: (configId: string) => Promise<void>;
  refreshStatus: (configId: string) => Promise<void>;
  refreshConfigs: () => Promise<void>;
  configs: Array<{
    id: string;
    instanceName: string;
    isConnected: boolean;
    isEnabled: boolean;
  }>;
  fetchConfigs: () => Promise<void>;
}

export function useWhatsApp(): WhatsAppConnectionState {
  const [config, setConfig] = useState<WhatsAppConfig>({
    isConnected: false,
    instanceId: undefined,
    qrCode: undefined,
    error: undefined,
    configId: undefined,
  });
  const [configs, setConfigs] = useState<WhatsAppConnectionState["configs"]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Clear polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const fetchConfigs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.api.whatsapp.configs.get();

      if (response.error) {
        console.error("Error fetching WhatsApp configs:", response.error);
        setConfigs([]);
        return;
      }

      const configsList = Array.isArray(response.data) ? response.data : [];

      // If no configs exist, call get-or-create endpoint
      if (configsList.length === 0) {
        const createResponse =
          await api.api.whatsapp.configs["get-or-create"].get();
        if (createResponse.error) {
          console.error(
            "Error creating WhatsApp config:",
            createResponse.error,
          );
          setConfigs([]);
          return;
        }

        // Add the newly created config to the list
        const newConfig = createResponse.data as any;
        setConfigs([
          {
            id: newConfig.id,
            instanceName: newConfig.instanceName,
            isConnected: newConfig.isConnected,
            isEnabled: newConfig.isEnabled,
          },
        ]);

        // Set it as the active config
        setConfig({
          isConnected: newConfig.isConnected,
          instanceId: newConfig.instanceId,
          qrCode: undefined,
          error: undefined,
          configId: newConfig.id,
        });
      } else {
        // Normal flow - existing configs found
        setConfigs(
          configsList.map((c: any) => ({
            id: c.id,
            instanceName: c.instanceName,
            isConnected: c.isConnected,
            isEnabled: c.isEnabled,
          })),
        );

        // If there's at least one config, set the first one as active
        if (configsList.length > 0) {
          const firstConfig = configsList[0];
          setConfig({
            isConnected: firstConfig.isConnected,
            instanceId: firstConfig.instanceId,
            qrCode: undefined,
            error: undefined,
            configId: firstConfig.id,
          });
        }
      }
    } catch (err: any) {
      console.error("Error fetching WhatsApp configs:", err);
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const connect = useCallback(
    async (configId: string) => {
      try {
        setIsLoading(true);
        // Clear any existing polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        // Use fetch directly for routes with dynamic parameters (edenTreaty type issues)
        const response = await fetch(
          `${API_URL}/api/whatsapp/configs/${configId}/connect`,
          {
            method: "POST",
            credentials: "include",
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.message || "Error al conectar WhatsApp";
          toast.error(errorMessage);
          setConfig((prev) => ({
            ...prev,
            error: errorMessage,
          }));
          return;
        }

        const data = await response.json();

        if (data && typeof data === "object" && "qrcode" in data) {
          const qrCodeData = data.qrcode;

          // The API returns base64 QR code
          const qrCodeDataUrl = qrCodeData.startsWith("data:")
            ? qrCodeData
            : `data:image/png;base64,${qrCodeData}`;

          setConfig({
            isConnected: false,
            instanceId: data.instanceName,
            qrCode: qrCodeDataUrl,
            error: undefined,
            configId,
          });

          toast.info("Escanea el código QR con la app de WhatsApp Business");

          // Poll for connection status every 3 seconds
          pollIntervalRef.current = setInterval(async () => {
            try {
              const statusResponse = await fetch(
                `${API_URL}/api/whatsapp/configs/${configId}/status`,
                {
                  credentials: "include",
                },
              );

              if (!statusResponse.ok) {
                return;
              }

              const statusData = await statusResponse.json();
              if (statusData?.isConnected) {
                // Clear polling
                if (pollIntervalRef.current) {
                  clearInterval(pollIntervalRef.current);
                  pollIntervalRef.current = null;
                }

                setConfig({
                  isConnected: true,
                  instanceId: statusData.instanceName || configId,
                  qrCode: undefined,
                  error: undefined,
                  configId,
                });

                // Refresh configs list
                await fetchConfigs();

                toast.success("WhatsApp conectado exitosamente");
              }
            } catch (err) {
              console.error("Error polling WhatsApp status:", err);
            }
          }, 3000);

          // Clear interval after 5 minutes (QR code expires)
          setTimeout(() => {
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              setConfig((prev) => ({
                ...prev,
                qrCode: undefined,
                error: "El código QR ha expirado. Intenta nuevamente.",
              }));
            }
          }, 300000);
        }
      } catch (err: any) {
        console.error("Error connecting WhatsApp:", err);
        toast.error(err?.message || "Error al conectar WhatsApp");
        setConfig((prev) => ({
          ...prev,
          error: err?.message || "Error al conectar WhatsApp",
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [fetchConfigs],
  );

  const disconnect = useCallback(
    async (configId: string) => {
      try {
        setIsLoading(true);
        // Clear any polling
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }

        // Use fetch directly for routes with dynamic parameters (edenTreaty type issues)
        const response = await fetch(
          `${API_URL}/api/whatsapp/configs/${configId}/disconnect`,
          {
            method: "POST",
            credentials: "include",
          },
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.message || "Error al desconectar WhatsApp";
          toast.error(errorMessage);
          return;
        }

        setConfig({
          isConnected: false,
          instanceId: undefined,
          qrCode: undefined,
          error: undefined,
          configId: undefined,
        });

        // Refresh configs list
        await fetchConfigs();

        toast.success("WhatsApp desconectado exitosamente");
      } catch (err: any) {
        console.error("Error disconnecting WhatsApp:", err);
        toast.error(err?.message || "Error al desconectar WhatsApp");
      } finally {
        setIsLoading(false);
      }
    },
    [fetchConfigs],
  );

  const refreshStatus = useCallback(async (configId: string) => {
    try {
      setIsLoading(true);
      // Use fetch directly for routes with dynamic parameters (edenTreaty type issues)
      const response = await fetch(
        `${API_URL}/api/whatsapp/configs/${configId}/status`,
        {
          credentials: "include",
        },
      );

      if (!response.ok) {
        console.error("Error refreshing status:", response.statusText);
        return;
      }

      const statusData = await response.json();
      setConfig((prev) => ({
        ...prev,
        isConnected: statusData?.isConnected ?? false,
        configId,
      }));
    } catch (err: any) {
      console.error("Error refreshing WhatsApp status:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshConfigs = useCallback(async () => {
    await fetchConfigs();
  }, [fetchConfigs]);

  // Fetch configs on mount
  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  return {
    config,
    isLoading,
    connect,
    disconnect,
    refreshStatus,
    refreshConfigs,
    configs,
    fetchConfigs,
  };
}
