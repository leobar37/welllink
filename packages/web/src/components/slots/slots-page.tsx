import { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SlotsList } from "@/components/slots";
import {
  useSlots,
  useBlockSlot,
  useUnblockSlot,
  useDeleteSlot,
} from "@/hooks/use-slots";
import { addDays, startOfWeek } from "date-fns";

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

  const { services, isLoading: isLoadingServices } = useMedicalServices(
    profile?.id || "",
  );

  const { data: slots, isLoading: isLoadingSlots } = useSlots({
    profileId: profile?.id || "",
    serviceId: selectedServiceId,
    startDate: currentWeekStart,
    endDate: addDays(currentWeekStart, 6),
  });

  const generateSlots = useGenerateSlots();
  const blockSlot = useBlockSlot();
  const unblockSlot = useUnblockSlot();
  const deleteSlot = useDeleteSlot();

  const handlePreviousWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDays(prev, 7));
  };

  const handleToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  };

  const handleGenerateNextWeek = () => {
    if (!selectedServiceId) {
      alert("Por favor selecciona un servicio");
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
      alert("Por favor selecciona un servicio");
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

  const weekEnd = addDays(currentWeekStart, 6);
  const formatDateRange = () => {
    const options = { day: "numeric", month: "short" } as const;
    return `${currentWeekStart.toLocaleDateString("es-ES", options)} - ${weekEnd.toLocaleDateString("es-ES", options)}`;
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
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={selectedServiceId}
            onValueChange={setSelectedServiceId}
          >
            <SelectTrigger className="w-[250px]">
              <SelectValue
                placeholder={
                  isLoadingServices
                    ? "Cargando..."
                    : services && services.length === 0
                      ? "No hay servicios"
                      : "Seleccionar servicio"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {services?.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name} ({service.duration} min)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleGenerateNextWeek}
            disabled={!selectedServiceId || generateSlots.isPending}
          >
            <Plus className="mr-2 h-4 w-4" />
            {generateSlots.isPending ? "Generando..." : "Generar Slots"}
          </Button>
          <Dialog
            open={isGenerateModalOpen}
            onOpenChange={setIsGenerateModalOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!selectedServiceId}>
                <Calendar className="mr-2 h-4 w-4" />
                Rango Personalizado
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Generar Slots en Rango Personalizado</DialogTitle>
                <DialogDescription>
                  Selecciona el rango de fechas para generar slots basados en
                  tus reglas de disponibilidad.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <div className="grid-content-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Desde</Label>
                    <input
                      id="start-date"
                      type="date"
                      value={customStartDate.toISOString().split("T")[0]}
                      onChange={(e) =>
                        setCustomStartDate(new Date(e.target.value))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">Hasta</Label>
                    <input
                      id="end-date"
                      type="date"
                      value={customEndDate.toISOString().split("T")[0]}
                      onChange={(e) =>
                        setCustomEndDate(new Date(e.target.value))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleGenerateCustomRange}
                  disabled={generateSlots.isPending}
                >
                  {generateSlots.isPending ? "Generando..." : "Generar Slots"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Week Navigation */}
      <Card>
        <CardHeader className="px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <CardTitle>Slots de la Semana</CardTitle>
              <CardDescription>{formatDateRange()}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousWeek}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleToday}>
                Hoy
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6">
          <SlotsList
            slots={slots || []}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
