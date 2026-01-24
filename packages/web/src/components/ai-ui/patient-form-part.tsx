import { memo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { PatientFormAIPart, AIUIHandlers } from "./types";

interface PatientFormPartProps {
  part: PatientFormAIPart;
  handlers: AIUIHandlers;
}

export const PatientFormPart = memo(
  ({ part, handlers }: PatientFormPartProps) => {
    const [formData, setFormData] = useState({
      name: "",
      phone: "",
      email: "",
      chiefComplaint: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        handlers.onSubmitPatientData?.({
          ...formData,
          serviceId: part.serviceId,
          slotId: part.slotId,
          serviceName: part.serviceName,
          date: part.date,
          time: part.time,
        });
      } finally {
        setIsSubmitting(false);
      }
    };

    const formatDate = (dateStr: string) => {
      try {
        return new Date(dateStr).toLocaleDateString("es-MX", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
      } catch {
        return dateStr;
      }
    };

    return (
      <div className="space-y-4 my-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <p className="text-sm font-medium">Resumen de tu cita:</p>
          <p className="text-sm text-muted-foreground">
            {part.serviceName} • {formatDate(part.date)} a las {part.time}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre completo *</Label>
            <Input
              id="name"
              placeholder="Ej. María García López"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Ej. 55 1234 5678"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (opcional)</Label>
            <Input
              id="email"
              type="email"
              placeholder="Ej. maria@email.com"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="chiefComplaint">
              Motivo de la consulta (opcional)
            </Label>
            <Textarea
              id="chiefComplaint"
              placeholder="Describe brevemente tu motivo de consulta..."
              value={formData.chiefComplaint}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  chiefComplaint: e.target.value,
                }))
              }
              disabled={isSubmitting}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Continuar"}
          </Button>
        </form>
      </div>
    );
  },
);

PatientFormPart.displayName = "PatientFormPart";

export default PatientFormPart;
