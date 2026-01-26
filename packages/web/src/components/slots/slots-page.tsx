import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useMedicalServices } from "@/hooks/use-medical-services";
import { useGenerateSlots } from "@/hooks/use-availability-rules";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SlotsList, EmptySlotsState } from "@/components/slots";
import {
  useSlots,
  useBlockSlot,
  useUnblockSlot,
  useDeleteSlot,
} from "@/hooks/use-slots";
import { addDays, startOfWeek } from "date-fns";
import { WeekNavigator } from "@/components/slots/week-navigator";
import { SlotGeneratorPanel } from "@/components/slots/slot-generator-panel";
import { toast } from "sonner";

export function SlotsPage() {
  const { profile, isLoading: isLoadingProfile } = useProfile();
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(
    addDays(new Date(), 6),
  );

  const profileId = profile?.id || "";

  const {
    services,
    isLoading: isLoadingServices,
    refetch: refetchServices,
  } = useMedicalServices(profileId);

  // Refetch services when profileId becomes available
  useEffect(() => {
    if (profileId) {
      refetchServices();
    }
  }, [profileId, refetchServices]);

  const {
    data: slots,
    isLoading: isLoadingSlots,
    refetch: refetchSlots,
  } = useSlots({
    profileId,
    serviceId: selectedServiceId,
    startDate: currentWeekStart,
    endDate: addDays(currentWeekStart, 6),
  });

  // Refetch slots when profileId becomes available
  useEffect(() => {
    if (profileId) {
      refetchSlots();
    }
  }, [profileId, refetchSlots]);

  const generateSlots = useGenerateSlots();
  const blockSlot = useBlockSlot();
  const unblockSlot = useUnblockSlot();
  const deleteSlot = useDeleteSlot();

  const handleGenerateNextWeek = () => {
    if (!selectedServiceId) {
      toast.error("Por favor selecciona un servicio");
      return;
    }
    generateSlots.mutate({
      profileId: profile?.id || "",
      serviceId: selectedServiceId,
      mode: "nextWeek",
    });
  };

  const handleGenerateCustomRange = () => {
    if (!selectedServiceId) {
      toast.error("Por favor selecciona un servicio");
      return;
    }
    generateSlots.mutate(
      {
        profileId: profile?.id || "",
        serviceId: selectedServiceId,
        mode: "range",
        startDate: customStartDate,
        endDate: customEndDate,
      },
      {
        onSuccess: () => {
          setIsGenerateModalOpen(false);
          toast.success("Slots generados exitosamente");
        },
      },
    );
  };

  const handleBlock = (slotId: string) => {
    blockSlot.mutate(slotId);
  };

  const handleUnblock = (slotId: string) => {
    unblockSlot.mutate(slotId);
  };

  const handleDelete = (slotId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este slot?")) {
      deleteSlot.mutate(slotId);
    }
  };

  if (isLoadingProfile || isLoadingServices || isLoadingSlots) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile?.id) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-muted">
          No hay un perfil seleccionado. Por favor selecciona un perfil para
          continuar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Gestión de Slots
          </h1>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Administra tus horarios disponibles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Custom Range Dialog */}
          <Button
            variant="outline"
            onClick={() => setIsGenerateModalOpen(true)}
            disabled={!selectedServiceId}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Rango Personalizado
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generator Panel - Sidebar */}
        <div className="lg:col-span-1">
          <SlotGeneratorPanel
            services={services || []}
            selectedServiceId={selectedServiceId}
            onServiceChange={setSelectedServiceId}
            onGenerate={(config) => {
              generateSlots.mutate({
                profileId: profile?.id || "",
                serviceId: config.serviceId,
                mode: "nextWeek",
              });
            }}
            onGenerateRange={(config, start, end) => {
              generateSlots.mutate(
                {
                  profileId: profile?.id || "",
                  serviceId: config.serviceId,
                  mode: "range",
                  startDate: start,
                  endDate: end,
                },
                {
                  onSuccess: () => {
                    toast.success("Slots generados exitosamente");
                  },
                },
              );
            }}
            isGenerating={generateSlots.isPending}
          />
        </div>

        {/* Slots List - Main Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="px-6">
              <WeekNavigator
                currentWeekStart={currentWeekStart}
                onWeekChange={setCurrentWeekStart}
              />
            </CardHeader>
            <CardContent className="px-6">
              {!slots || slots.length === 0 ? (
                <EmptySlotsState
                  onGenerate={handleGenerateNextWeek}
                  isGenerating={generateSlots.isPending}
                />
              ) : (
                <SlotsList
                  slots={slots || []}
                  onBlock={handleBlock}
                  onUnblock={handleUnblock}
                  onDelete={handleDelete}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Custom Range Dialog */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Generar Slots en Rango Personalizado</CardTitle>
              <CardDescription>
                Selecciona el rango de fechas para generar slots basados en tus
                reglas de disponibilidad.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Desde</label>
                  <input
                    type="date"
                    value={customStartDate.toISOString().split("T")[0]}
                    onChange={(e) =>
                      setCustomStartDate(new Date(e.target.value))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hasta</label>
                  <input
                    type="date"
                    value={customEndDate.toISOString().split("T")[0]}
                    onChange={(e) => setCustomEndDate(new Date(e.target.value))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsGenerateModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleGenerateCustomRange}
                  disabled={generateSlots.isPending}
                >
                  {generateSlots.isPending ? "Generando..." : "Generar Slots"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
