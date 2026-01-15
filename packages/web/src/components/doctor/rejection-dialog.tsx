import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useRejectRequest } from "@/hooks/use-reservation-requests";

interface RejectionDialogProps {
  request: PendingRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const rejectionSchema = z.object({
  rejectionReason: z
    .string()
    .min(10, { message: "Por favor proporcione una razón detallada (mínimo 10 caracteres)" }),
});

type RejectionFormValues = z.infer<typeof rejectionSchema>;

export function RejectionDialog({
  request,
  open,
  onOpenChange,
  onSuccess,
}: RejectionDialogProps) {
  const { mutate: rejectRequest, isPending } = useRejectRequest();

  const form = useForm<RejectionFormValues>({
    resolver: zodResolver(rejectionSchema),
    defaultValues: {
      rejectionReason: "",
    },
  });

  function onSubmit(values: RejectionFormValues) {
    if (!request) return;

    rejectRequest(
      {
        requestId: request.id,
        rejectedBy: request.profileId,
        rejectionReason: values.rejectionReason,
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
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Rechazar esta solicitud?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de rechazar la cita de{" "}
            <strong>{request.patientName}</strong>
            {request.service && ` para ${request.service.name}`}. Por favor proporcione una
            razón detallada para el rechazo.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rejectionReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razón del rechazo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Explica por qué rechazas esta solicitud..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <AlertDialogFooter>
              <AlertDialogCancel asChild disabled={isPending}>
                <button type="button">Cancelar</button>
              </AlertDialogCancel>
              <AlertDialogAction asChild disabled={isPending}>
                <button type="submit">
                  {isPending ? "Rechazando..." : "Confirmar Rechazo"}
                </button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </form>
        </Form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
