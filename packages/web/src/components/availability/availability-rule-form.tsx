import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AvailabilityRule, CreateAvailabilityRuleData } from "@/hooks/use-availability-rules";

const availabilityRuleSchema = z
  .object({
    dayOfWeek: z.number({ required_error: "El día es requerido" }),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Formato inválido. Use HH:MM",
    }),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
      message: "Formato inválido. Use HH:MM",
    }),
    slotDuration: z.number({ required_error: "La duración es requerida" }).min(15, {
      message: "Mínimo 15 minutos",
    }),
    bufferTime: z.number().min(0).optional(),
    maxAppointmentsPerSlot: z.number().min(1).optional(),
    effectiveFrom: z.string().optional(),
    effectiveTo: z.string().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "La hora de fin debe ser posterior a la hora de inicio",
    path: ["endTime"],
  });

type AvailabilityRuleFormValues = z.infer<typeof availabilityRuleSchema>;

const DAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
];

const DURATIONS = [15, 30, 45, 60, 75, 90, 120];

interface AvailabilityRuleFormProps {
  profileId: string;
  rule?: AvailabilityRule;
  onSubmit: (data: CreateAvailabilityRuleData) => void;
  isLoading?: boolean;
}

export function AvailabilityRuleForm({
  profileId,
  rule,
  onSubmit,
  isLoading = false,
}: AvailabilityRuleFormProps) {
  const form = useForm<AvailabilityRuleFormValues>({
    resolver: zodResolver(availabilityRuleSchema),
    defaultValues: rule
      ? {
          dayOfWeek: rule.dayOfWeek,
          startTime: rule.startTime,
          endTime: rule.endTime,
          slotDuration: rule.slotDuration,
          bufferTime: rule.bufferTime,
          maxAppointmentsPerSlot: rule.maxAppointmentsPerSlot,
          effectiveFrom: rule.effectiveFrom,
          effectiveTo: rule.effectiveTo,
        }
      : {
          dayOfWeek: 1,
          startTime: "09:00",
          endTime: "17:00",
          slotDuration: 30,
          bufferTime: 0,
          maxAppointmentsPerSlot: 1,
          effectiveFrom: undefined,
          effectiveTo: undefined,
        },
  });

  const handleSubmit = (data: AvailabilityRuleFormValues) => {
    const submitData: CreateAvailabilityRuleData = {
      profileId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
      slotDuration: data.slotDuration,
      bufferTime: data.bufferTime,
      maxAppointmentsPerSlot: data.maxAppointmentsPerSlot,
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : undefined,
      effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : undefined,
    };

    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Día de la semana</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un día" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DAYS.map((day) => (
                      <SelectItem key={day.value} value={String(day.value)}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="slotDuration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración de cada cita</FormLabel>
                <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={String(field.value)}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Duración" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DURATIONS.map((duration) => (
                      <SelectItem key={duration} value={String(duration)}>
                        {duration} minutos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Cuánto tiempo dura cada cita
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de inicio</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hora de fin</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="bufferTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiempo de espera</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="0"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Minutos de espera entre citas (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="maxAppointmentsPerSlot"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Máximo de citas por slot</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    placeholder="1"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  Cuántos pacientes pueden agendar el mismo horario
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {rule ? "Actualizar" : "Crear"} Regla
          </Button>
        </div>
      </form>
    </Form>
  );
}
