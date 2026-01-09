import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { clientFormSchema, type ClientForm } from "./client-form-schema";
import type { Client } from "@/hooks/use-clients";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client; // If provided, it's an edit form
  onSave: (data: ClientForm) => Promise<void>;
}

export function ClientForm({ open, onOpenChange, client, onSave }: ClientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
  } = useForm<ClientForm>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: client?.name || "",
      phone: client?.phone || "",
      email: client?.email || "",
      label: client?.label || "prospecto",
      notes: client?.notes || "",
    },
  });

  const onSubmit = async (data: ClientForm) => {
    await onSave(data);
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={client ? "Editar Cliente" : "Nuevo Cliente"}
      description="Completa la información del cliente"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            placeholder="Nombre del cliente"
            {...register("name")}
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono *</Label>
          <Input
            id="phone"
            placeholder="+1234567890"
            {...register("phone")}
            disabled={isSubmitting}
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="cliente@email.com"
            {...register("email")}
            disabled={isSubmitting}
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="label">Etiqueta *</Label>
          <Select
            value={watch("label")}
            onValueChange={(value) => setValue("label", value as ClientForm["label"])}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una etiqueta" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="prospecto">Prospecto</SelectItem>
              <SelectItem value="consumidor">Consumidor</SelectItem>
              <SelectItem value="afiliado">Afiliado</SelectItem>
            </SelectContent>
          </Select>
          {errors.label && (
            <p className="text-sm text-destructive">{errors.label.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            placeholder="Notas adicionales..."
            {...register("notes")}
            disabled={isSubmitting}
            rows={3}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            "Guardar"
          )}
        </Button>
      </form>
    </ResponsiveDialog>
  );
}
