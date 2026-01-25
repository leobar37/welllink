import { useState, useMemo } from "react";
import { Plus, Calendar, Settings2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { SlotPreviewTimeline } from "./slot-preview-timeline";
import { format, addDays } from "date-fns";

interface Service {
  id: string;
  name: string;
  duration: number;
  price?: string | null;
}

interface SlotGeneratorPanelProps {
  services: Service[];
  selectedServiceId: string;
  onServiceChange: (serviceId: string) => void;
  onGenerate: (config: GeneratorConfig) => void;
  onGenerateRange: (
    config: GeneratorConfig,
    startDate: Date,
    endDate: Date,
  ) => void;
  isGenerating?: boolean;
  className?: string;
}

export interface GeneratorConfig {
  serviceId: string;
  startTime: string;
  endTime: string;
  interval: number;
}

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "18:00";
const DEFAULT_INTERVAL = 30;

export function SlotGeneratorPanel({
  services,
  selectedServiceId,
  onServiceChange,
  onGenerate,
  onGenerateRange,
  isGenerating = false,
  className,
}: SlotGeneratorPanelProps) {
  const [startTime, setStartTime] = useState(DEFAULT_START_TIME);
  const [endTime, setEndTime] = useState(DEFAULT_END_TIME);
  const [interval, setInterval] = useState(DEFAULT_INTERVAL);
  const [startDate, setStartDate] = useState<Date>(() => new Date());
  const [endDate, setEndDate] = useState<Date>(() => addDays(new Date(), 6));

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const serviceDuration = selectedService?.duration || 60;

  // Calculate preview slots
  const previewSlots = useMemo(() => {
    const slots: Array<{ startTime: string; status: string }> = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    while (currentMinutes + serviceDuration <= endMinutes) {
      const hour = Math.floor(currentMinutes / 60);
      const min = currentMinutes % 60;
      const timeStr = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;

      slots.push({
        startTime: timeStr,
        status: "available",
      });

      currentMinutes += interval;
    }

    return slots;
  }, [startTime, endTime, interval, serviceDuration]);

  const handleGenerate = () => {
    onGenerate({
      serviceId: selectedServiceId,
      startTime,
      endTime,
      interval,
    });
  };

  const handleGenerateRange = () => {
    onGenerateRange(
      {
        serviceId: selectedServiceId,
        startTime,
        endTime,
        interval,
      },
      startDate,
      endDate,
    );
  };

  const isValid =
    selectedServiceId !== "" && startTime < endTime && previewSlots.length > 0;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="size-5 text-primary" />
            <CardTitle className="text-lg">Generador de Slots</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => {
              setStartTime(DEFAULT_START_TIME);
              setEndTime(DEFAULT_END_TIME);
              setInterval(DEFAULT_INTERVAL);
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
        <CardDescription>
          Configura los parámetros para generar horarios disponibles
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Service Selection */}
        <div className="space-y-2">
          <Label htmlFor="service">Servicio</Label>
          <Select value={selectedServiceId} onValueChange={onServiceChange}>
            <SelectTrigger id="service">
              <SelectValue placeholder="Seleccionar servicio" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  <div className="flex items-center justify-between gap-4 w-full overflow-hidden">
                    <span className="truncate block max-w-[180px]">
                      {service.name}
                      {service.price && (
                        <span className="text-muted-foreground ml-2">
                          • S/.{service.price}
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground text-xs shrink-0">
                      {service.duration}min
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Time Configuration */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Hora inicio</Label>
            <Input
              id="start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Hora fin</Label>
            <Input
              id="end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>
        </div>

        {/* Interval */}
        <div className="space-y-2">
          <Label htmlFor="interval">Intervalo entre slots</Label>
          <Select
            value={interval.toString()}
            onValueChange={(v) => setInterval(Number(v))}
          >
            <SelectTrigger id="interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="45">45 minutos</SelectItem>
              <SelectItem value="60">60 minutos (1 hora)</SelectItem>
              <SelectItem value="90">90 minutos (1.5 horas)</SelectItem>
              <SelectItem value="120">120 minutos (2 horas)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Preview */}
        <div className="space-y-2">
          <Label>Vista previa de generación</Label>
          <p className="text-xs text-muted-foreground">
            Estos son los slots que se crearán para cada día seleccionado.
          </p>
          <SlotPreviewTimeline
            startTime={startTime}
            endTime={endTime}
            interval={interval}
            serviceDuration={serviceDuration}
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={handleGenerate}
            disabled={!isValid || isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Sparkles className="size-4 mr-2 animate-pulse" />
                Generando...
              </>
            ) : (
              <>
                <Plus className="size-4 mr-2" />
                Generar para hoy ({previewSlots.length} slots)
              </>
            )}
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Desde</Label>
              <Input
                type="date"
                value={startDate.toISOString().split("T")[0]}
                onChange={(e) => setStartDate(new Date(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Hasta</Label>
              <Input
                type="date"
                value={endDate.toISOString().split("T")[0]}
                onChange={(e) => setEndDate(new Date(e.target.value))}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleGenerateRange}
            disabled={!isValid || isGenerating}
            className="w-full"
          >
            <Calendar className="size-4 mr-2" />
            Generar rango ({format(startDate, "d MMM")} -{" "}
            {format(endDate, "d MMM")})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick generate button with dropdown
interface QuickGenerateButtonProps {
  services: Service[];
  onQuickGenerate: (serviceId: string) => void;
  onCustomGenerate: () => void;
  isGenerating?: boolean;
}

export function QuickGenerateButton({
  services,
  onQuickGenerate,
  onCustomGenerate,
  isGenerating = false,
}: QuickGenerateButtonProps) {
  return (
    <div className="relative group">
      <Button disabled={isGenerating}>
        <Plus className="size-4 mr-2" />
        {isGenerating ? "Generando..." : "Generar Slots"}
      </Button>

      {/* Hover dropdown */}
      <div className="absolute top-full left-0 mt-1 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
        <Card className="shadow-lg">
          <CardContent className="p-2 space-y-1">
            <div className="text-xs font-medium text-muted-foreground px-2 py-1">
              Generar para la próxima semana
            </div>
            {services.slice(0, 3).map((service) => (
              <Button
                key={service.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => onQuickGenerate(service.id)}
              >
                <span className="truncate">{service.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {service.duration}min
                </span>
              </Button>
            ))}
            {services.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={onCustomGenerate}
              >
                <Settings2 className="size-4 mr-2" />
                Configuración personalizada
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
