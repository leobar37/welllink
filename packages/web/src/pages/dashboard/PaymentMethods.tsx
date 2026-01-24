import { useState, useEffect } from "react";
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
  Check,
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePaymentMethods } from "@/hooks/use-payment-methods";
import { cn } from "@/lib/utils";
import type { PaymentMethodType } from "@/lib/types";
import { PaymentMethodCard } from "@/components/dashboard/PaymentMethodCard";

const paymentMethodSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
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
    label: "Transferencia Bancaria",
    icon: Building2,
    color: "text-gray-600",
  },
  digital_wallet: {
    label: "Billetera Digital",
    icon: Smartphone,
    color: "text-purple-600",
  },
  insurance: {
    label: "Seguro Médico",
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
  } = usePaymentMethods();

  const [adding, setAdding] = useState(false);
  const [selectedMethods, setSelectedMethods] = useState<Set<string>>(
    new Set(),
  );
  const [editMode, setEditMode] = useState<"toggle" | "edit">("toggle");

  const form = useForm<PaymentMethodValues>({
    resolver: zodResolver(paymentMethodSchema),
    defaultValues: {
      name: "",
      type: "cash",
      instructions: "",
    },
  });

  // Initialize selected methods with currently active ones
  useEffect(() => {
    if (methods) {
      const activeIds = methods.filter((m) => m.isActive).map((m) => m.id);
      setSelectedMethods(new Set(activeIds));
    }
  }, [methods]);

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
          setAdding(false);
          form.reset();
        },
      },
    );
  }

  function handleToggle(id: string, checked: boolean) {
    const newSelected = new Set(selectedMethods);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedMethods(newSelected);
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

  const activeCount = methods?.filter((m) => m.isActive).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Métodos de Pago</h1>
          <p className="text-muted-foreground mt-1">
            Activa los métodos que deseas aceptar en tu clínica
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => seedDefaults.mutate()}
            disabled={seedDefaults.isPending}
          >
            {seedDefaults.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="mr-2 h-4 w-4" />
            )}
            Restaurar Defaults
          </Button>
          <Button onClick={() => setAdding(!adding)} disabled={adding}>
            <Plus className="mr-2 h-4 w-4" />
            Agregar Método
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "p-2 rounded-full",
                  activeCount > 0 ? "bg-green-100" : "bg-gray-100",
                )}
              >
                {activeCount > 0 ? (
                  <Check className="h-5 w-5 text-green-600" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                )}
              </div>
              <div>
                <p className="font-medium">
                  {activeCount} de {methods?.length || 0} métodos activos
                </p>
                <p className="text-sm text-muted-foreground">
                  Activa los métodos que quieres mostrar a tus pacientes
                </p>
              </div>
            </div>
            {selectedMethods.size > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedMethods.size} método(s) seleccionado(s)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mode Toggle */}
      <div className="flex gap-2 border-b pb-2">
        <Button
          variant={editMode === "toggle" ? "default" : "ghost"}
          size="sm"
          onClick={() => setEditMode("toggle")}
        >
          <Check className="mr-2 h-4 w-4" />
          Seleccionar
        </Button>
        <Button
          variant={editMode === "edit" ? "default" : "ghost"}
          size="sm"
          onClick={() => setEditMode("edit")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Editar
        </Button>
      </div>

      {adding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">
              Nuevo Método Personalizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Pago</FormLabel>
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
                        <Input
                          placeholder="Ej: Visa terminada en 4242"
                          {...field}
                        />
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
                          placeholder="Instrucciones para el cliente..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={createMethod.isPending}>
                    {createMethod.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setAdding(false);
                      form.reset();
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="space-y-3">
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
              editMode={editMode}
              isSelected={selectedMethods.has(method.id)}
              index={index}
              totalMethods={methods.length}
              canDelete={true}
              isDeleting={deleteMethod.isPending}
              onToggle={handleToggle}
              onMove={handleMove}
              onDelete={(id) => deleteMethod.mutate(id)}
            />
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
            No hay métodos de pago configurados. Haz clic en "Restaurar
            Defaults" para agregar los métodos estándar.
          </div>
        )}
      </div>
    </div>
  );
}
