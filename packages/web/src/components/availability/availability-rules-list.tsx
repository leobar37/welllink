import { Loader2, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AvailabilityRule } from "@/hooks/use-availability-rules";
import { getDayName } from "@/hooks/use-availability-rules";

interface AvailabilityRulesListProps {
  rules: AvailabilityRule[];
  isLoading?: boolean;
  onEdit?: (rule: AvailabilityRule) => void;
  onDelete?: (ruleId: string) => void;
}

export function AvailabilityRulesList({
  rules,
  isLoading = false,
  onEdit,
  onDelete,
}: AvailabilityRulesListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!rules || rules.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
        No hay reglas de disponibilidad configuradas.
        <br />
        Agrega una nueva regla para empezar.
      </div>
    );
  }

  // Group rules by day
  const groupedRules = rules.reduce((acc, rule) => {
    const dayName = getDayName(rule.dayOfWeek);
    if (!acc[dayName]) {
      acc[dayName] = [];
    }
    acc[dayName].push(rule);
    return acc;
  }, {} as Record<string, AvailabilityRule[]>);

  // Sort days in order
  const dayOrder = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo",
  ];

  return (
    <div className="space-y-4">
      {dayOrder.map((dayName) => {
        const dayRules = groupedRules[dayName];
        if (!dayRules || dayRules.length === 0) return null;

        return (
          <div key={dayName} className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">
              {dayName}
            </h3>
            {dayRules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-medium">
                        {new Date(rule.startTime).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(rule.endTime).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <Badge variant="secondary">
                        {rule.slotDuration}min
                      </Badge>
                      {rule.bufferTime && rule.bufferTime > 0 && (
                        <Badge variant="outline">
                          +{rule.bufferTime}min espera
                        </Badge>
                      )}
                      {!rule.isActive && (
                        <Badge variant="destructive">Inactiva</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Máximo {rule.maxAppointmentsPerSlot} cita{rule.maxAppointmentsPerSlot > 1 ? "s" : ""} por horario
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {onEdit && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(rule.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        );
      })}
    </div>
  );
}
