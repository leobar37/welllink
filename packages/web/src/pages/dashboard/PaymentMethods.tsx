import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  CreditCard,
  Building2,
  Smartphone,
  Shield,
  Calendar,
  DollarSign,
  RotateCcw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import type { PaymentMethodType } from "@/lib/types";
import { PaymentMethodCard } from "@/components/dashboard/PaymentMethodCard";

const paymentMethodSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  type: z.enum([
    "cash",
    "credit_card",
    "debit_card",
    "bank_transfer",
    "digital_wallet",
    "insurance",
    "payment_plan",
  ]),
  instructions: z.string().optional(),
});

type PaymentMethodValues = z.infer<typeof paymentMethodSchema>;

const typeLabels: Record<
  PaymentMethodType,
  { label: string; icon: typeof CreditCard; color: string }
> = {
  cash: { label: "Efectivo", icon: DollarSign, color: "text-green-600" },
  credit_card: {
    label: "Tarjeta de Crédito",
    icon: CreditCard,
    color: "text-blue-600",
  },
  debit_card: {
    label: "Tarjeta de Débito",
    icon: CreditCard,
    color: "text-indigo-600",
  },
  bank_transfer: {
    label: "Transferencia",
    icon: Building2,
    color: "text-muted-foreground",
  },
  digital_wallet: {
    label: "Billetera",
    icon: Smartphone,
    color: "text-purple-600",
  },
  insurance: {
    label: "Seguro",
    icon: Shield,
    color: "text-emerald-600",
  },
  payment_plan: {
    label: "Plan de Pago",
    icon: Calendar,
    color: "text-orange-600",
  },
};

export function PaymentMethodsPage() {
  const {
    methods,
    isLoading,
    createMethod,
    deleteMethod,
    reorderMethods,
    seedDefaults,
    toggleMethod,
  } = usePaymentMethods();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const form = useForm<PaymentMethodValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: "",
      type: "cash",
      instructions: "",
    },
  });

  function onSubmit(data: PaymentMethodValues) {
    createMethod.mutate(
      {
        name: data.name,
        type: data.type,
        instructions: data.instructions || null,
        details: null,
      },
      {
        onSuccess: () => {
          setIsAddModalOpen(false);
          form.reset();
        },
      },
    );
  }

  function handleToggle(id: string, checked: boolean) {
    toggleMethod.mutate({ id, data: { isActive: checked } });
  }

  function handleMove(index: number, direction: "up" | "down") {
    if (!methods) return;
    const newMethods = [...methods];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newMethods.length) return;

    const temp = newMethods[index];
    newMethods[index] = newMethods[targetIndex];
    newMethods[targetIndex] = temp;

    reorderMethods.mutate(newMethods.map((m) => m.id));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Métodos de Pago
          </h1>
          <p className="text-sm text-muted-foreground">
            Activa los métodos que aceptas en tu clínica
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => seedDefaults.mutate()}
            disabled={seedDefaults.isPending}
            className="text-muted-foreground"
          >
            {seedDefaults.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Restaurar
          </Button>
          <Button size="sm" onClick={() => setIsAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar
          </Button>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Método</DialogTitle>
            <DialogDescription>
              Agrega un método de pago personalizado
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(typeLabels).map(
                          ([value, { label }]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Yape, Plin, BCP..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instrucciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Opcional: instrucciones para el cliente"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    form.reset();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMethod.isPending}>
                  {createMethod.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="space-y-2">
        {methods && methods.length > 0 ? (
          methods.map((method, index) => (
            <PaymentMethodCard
              key={method.id}
              id={method.id}
              name={method.name}
              type={method.type}
              instructions={method.instructions}
              isActive={method.isActive}
              typeLabels={typeLabels}
              index={index}
              totalMethods={methods.length}
              canDelete={true}
              isDeleting={deleteMethod.isPending}
              isToggling={toggleMethod.isPending}
              onToggle={handleToggle}
              onMove={handleMove}
              onDelete={(id) => deleteMethod.mutate(id)}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">No hay métodos configurados</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => seedDefaults.mutate()}
              disabled={seedDefaults.isPending}
              className="mt-1"
            >
              Restaurar métodos por defecto
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
