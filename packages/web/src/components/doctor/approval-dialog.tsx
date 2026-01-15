import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { PendingRequest } from "@/hooks/use-reservation-requests";
import { useApproveRequest } from "@/hooks/use-reservation-requests";

interface ApprovalDialogProps {
  request: PendingRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const approvalSchema = z.object({
  notes: z.string().optional(),
  price: z.number().optional(),
});

type ApprovalFormValues = z.infer<typeof approvalSchema>;

export function ApprovalDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: ApprovalDialogProps) {
  const { mutate: approveRequest, isPending } = useApproveRequest();

  const form = useForm<ApprovalFormValues>({
    resolver: zodResolver(approvalSchema),
    defaultValues: {
      notes: "",
      price: undefined,
    },
  });

  function onSubmit(values: ApprovalFormValues) {
    if (!request) return;

    approveRequest(
      {
        requestId: request.id,
        approvedBy: request.profileId,
        notes: values.notes,
        ...(values.price && { changes: { price: values.price } }),
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
          onSuccess?.();
        },
      }
    );
  }

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Aprobar Solicitud</DialogTitle>
          <DialogDescription>
            Aprobar la cita de <strong>{request.patientName}</strong>
            {request.service && ` para ${request.service.name}`}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas para el paciente (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Añade notas adicionales para el paciente..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {request.service?.price && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Ajustar precio (opcional) - Actual: $
                      {request.service.price}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Precio ajustado"
                        step="0.01"
                        min="0"
                        {...field}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          field.onChange(isNaN(value) ? undefined : value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Aprobando..." : "Aprobar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
