import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import { usePurchaseOrder, type PurchaseOrderItem, type PurchaseOrderStatus } from "@/hooks/use-purchase-orders";
import { useInventoryProducts, type Product } from "@/hooks/use-inventory";
import { Loader2, ArrowLeft, Send, Package, XCircle, CheckCircle, Plus, Minus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Status labels
const statusLabels: Record<PurchaseOrderStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  sent: { label: "Enviada", variant: "default" },
  partial: { label: "Parcial", variant: "outline" },
  received: { label: "Recibida", variant: "success" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

// Receive form schema
const receiveItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  location: z.string().default("default"),
  notes: z.string().optional(),
});

const receiveSchema = z.object({
  items: z.array(receiveItemSchema).min(1, "Selecciona al menos un producto"),
});

type ReceiveFormData = z.infer<typeof receiveSchema>;

// Cancel reason schema
const cancelSchema = z.object({
  reason: z.string().min(1, "Ingresa el motivo de cancelación"),
});

type CancelFormData = z.infer<typeof cancelSchema>;

// Format date
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Format currency
const formatCurrency = (amount: string | number) => {
  return `$${Number(amount).toFixed(2)}`;
};

export function PurchaseOrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useProfile();
  const profileId = profile?.id || "";

  const { purchaseOrder, isLoading, receivePurchaseOrder, sendPurchaseOrder, cancelPurchaseOrder, refetch } = usePurchaseOrder(profileId, id || "");
  const { products } = useInventoryProducts(profileId);

  // State
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  // Receive form
  const receiveForm = useForm<ReceiveFormData>({
    resolver: zodResolver(receiveSchema),
    defaultValues: {
      items: [],
    },
  });

  // Cancel form
  const cancelForm = useForm<CancelFormData>({
    resolver: zodResolver(cancelSchema),
    defaultValues: {
      reason: "",
    },
  });

  // Get items that can be received (not fully received)
  const receivableItems = useMemo(() => {
    if (!purchaseOrder?.items) return [];
    return purchaseOrder.items.filter((item) => {
      const remaining = item.quantity - item.receivedQuantity;
      return remaining > 0;
    });
  }, [purchaseOrder?.items]);

  // Prepare receive form with initial items
  const handleOpenReceiveModal = () => {
    const initialItems = receivableItems.map((item) => ({
      productId: item.productId,
      quantity: item.quantity - item.receivedQuantity,
      location: "default",
      notes: "",
    }));
    receiveForm.reset({ items: initialItems });
    setIsReceiveModalOpen(true);
  };

  // Handle receive submit
  const handleReceive = async (data: ReceiveFormData) => {
    try {
      await receivePurchaseOrder.mutateAsync({
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          location: item.location,
          notes: item.notes,
        })),
      });
      setIsReceiveModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Error receiving order:", error);
    }
  };

  // Handle send
  const handleSend = async () => {
    try {
      await sendPurchaseOrder.mutateAsync();
      refetch();
    } catch (error) {
      console.error("Error sending order:", error);
    }
  };

  // Handle cancel
  const handleCancel = async (data: CancelFormData) => {
    try {
      await cancelPurchaseOrder.mutateAsync(data.reason);
      setIsCancelModalOpen(false);
      refetch();
    } catch (error) {
      console.error("Error cancelling order:", error);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not found
  if (!purchaseOrder) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-medium">Orden de compra no encontrada</p>
          <Button variant="link" onClick={() => navigate("/dashboard/purchase-orders")}>
            Volver a órdenes
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = statusLabels[purchaseOrder.status];
  const canEdit = purchaseOrder.status === "draft";
  const canSend = purchaseOrder.status === "draft";
  const canReceive = purchaseOrder.status === "sent" || purchaseOrder.status === "partial";
  const canCancel = purchaseOrder.status === "draft" || purchaseOrder.status === "sent";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/purchase-orders")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Orden de Compra {purchaseOrder.orderNumber || purchaseOrder.id.slice(0, 8)}
              </h1>
              <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </div>
            <p className="text-muted-foreground">
              Proveedor: {purchaseOrder.supplier?.name || "-"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canSend && (
            <Button onClick={handleSend} disabled={sendPurchaseOrder.isPending}>
              {sendPurchaseOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Enviar Orden
            </Button>
          )}
          {canReceive && (
            <Button onClick={handleOpenReceiveModal} disabled={receivePurchaseOrder.isPending}>
              {receivePurchaseOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Package className="mr-2 h-4 w-4" />
              Recibir Mercancía
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={() => setIsCancelModalOpen(true)}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancelar
            </Button>
          )}
        </div>
      </div>

      {/* Order Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Información General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Proveedor</span>
              <span className="font-medium">{purchaseOrder.supplier?.name || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha Esperada</span>
              <span className="font-medium">{formatDate(purchaseOrder.expectedDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha de Creación</span>
              <span className="font-medium">{formatDate(purchaseOrder.createdAt)}</span>
            </div>
            {purchaseOrder.sentAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de Envío</span>
                <span className="font-medium">{formatDate(purchaseOrder.sentAt)}</span>
              </div>
            )}
            {purchaseOrder.receivedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha de Recepción</span>
                <span className="font-medium">{formatDate(purchaseOrder.receivedAt)}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Totales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${(Number(purchaseOrder.total) - Number(purchaseOrder.tax || 0)).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">IVA</span>
              <span className="font-medium">{formatCurrency(purchaseOrder.tax || 0)}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="font-bold">Total</span>
              <span className="font-bold text-lg">{formatCurrency(purchaseOrder.total)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {purchaseOrder.notes || "Sin notas"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>Productos</CardTitle>
          <CardDescription>
            {purchaseOrder.items?.length || 0} producto(s) en la orden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Cantidad</TableHead>
                <TableHead className="text-right">Recibido</TableHead>
                <TableHead className="text-right">Pendiente</TableHead>
                <TableHead className="text-right">Precio Unit.</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {purchaseOrder.items?.map((item) => {
                const remaining = item.quantity - item.receivedQuantity;
                const isFullyReceived = remaining <= 0;
                const product = products?.find((p) => p.id === item.productId);

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {product?.name || item.product?.name || item.productId.slice(0, 8)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {product?.sku || item.product?.sku || "-"}
                    </TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      <span className={isFullyReceived ? "text-green-500" : ""}>
                        {item.receivedQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {!isFullyReceived && (
                        <Badge variant="outline">{remaining}</Badge>
                      )}
                      {isFullyReceived && <CheckCircle className="h-4 w-4 text-green-500" />}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Receive Modal */}
      <Dialog open={isReceiveModalOpen} onOpenChange={setIsReceiveModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Recibir Mercancía</DialogTitle>
            <DialogDescription>
              Ingresa las cantidades recibidas para cada producto
            </DialogDescription>
          </DialogHeader>
          <Form {...receiveForm}>
            <form onSubmit={receiveForm.handleSubmit(handleReceive)} className="space-y-4">
              {receiveForm.watch("items").map((item, index) => {
                const originalItem = receivableItems[index];
                const product = products?.find((p) => p.id === item.productId);
                const maxQuantity = originalItem ? originalItem.quantity - originalItem.receivedQuantity : 0;

                return (
                  <div key={index} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{product?.name || item.productId}</div>
                      <div className="text-sm text-muted-foreground">
                        Pendiente: {maxQuantity}
                      </div>
                    </div>
                    <div className="w-full md:w-32">
                      <FormField
                        control={receiveForm.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Cantidad</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                max={maxQuantity}
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="w-full md:w-40">
                      <FormField
                        control={receiveForm.control}
                        name={`items.${index}.location`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">Ubicación</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Ubicación" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="default">Default</SelectItem>
                                <SelectItem value="warehouse">Almacén</SelectItem>
                                <SelectItem value="store">Tienda</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                );
              })}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReceiveModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={receivePurchaseOrder.isPending}>
                  {receivePurchaseOrder.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmar Recepción
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Cancel Modal */}
      <Dialog open={isCancelModalOpen} onOpenChange={setIsCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Orden de Compra</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas cancelar esta orden de compra?
            </DialogDescription>
          </DialogHeader>
          <Form {...cancelForm}>
            <form onSubmit={cancelForm.handleSubmit(handleCancel)} className="space-y-4">
              <FormField
                control={cancelForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo de cancelación</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ingresa el motivo..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  Volver
                </Button>
                <Button type="submit" variant="destructive" disabled={cancelPurchaseOrder.isPending}>
                  {cancelPurchaseOrder.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Confirmar Cancelación
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
