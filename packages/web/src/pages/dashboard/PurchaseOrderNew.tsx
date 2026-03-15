import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import { useSuppliers, useInventoryProducts, type Product } from "@/hooks/use-inventory";
import { usePurchaseOrders, type CreatePurchaseOrderData } from "@/hooks/use-purchase-orders";
import { Loader2, Plus, Trash2, ArrowLeft, Save, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Line item schema
const lineItemSchema = z.object({
  productId: z.string().min(1, "Selecciona un producto"),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  unitPrice: z.number().min(0, "El precio debe ser positivo"),
  notes: z.string().optional(),
});

// Main form schema
const purchaseOrderSchema = z.object({
  supplierId: z.string().min(1, "Selecciona un proveedor"),
  orderNumber: z.string().optional(),
  expectedDate: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(lineItemSchema).min(1, "Agrega al menos un producto"),
});

type PurchaseOrderFormData = z.infer<typeof purchaseOrderSchema>;

// Line item type for form
interface LineItemFormData {
  productId: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export function PurchaseOrderNewPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const profileId = profile?.id || "";

  const { suppliers } = useSuppliers(profileId);
  const { products } = useInventoryProducts(profileId);
  const { createPurchaseOrder } = usePurchaseOrders(profileId);

  // Form
  const form = useForm<PurchaseOrderFormData>({
    resolver: zodResolver(purchaseOrderSchema),
    defaultValues: {
      supplierId: "",
      orderNumber: "",
      expectedDate: "",
      notes: "",
      items: [{ productId: "", quantity: 1, unitPrice: 0, notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Calculate totals
  const totals = useMemo(() => {
    const items = form.watch("items") || [];
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
    const tax = subtotal * 0.16; // 16% tax
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [form.watch("items")]);

  // Handle product selection - auto-fill price from product
  const handleProductSelect = (index: number, productId: string) => {
    const product = products?.find((p) => p.id === productId);
    if (product) {
      const currentItems = form.getValues("items");
      currentItems[index].unitPrice = Number(product.cost || product.price || 0);
      form.setValue("items", currentItems);
    }
  };

  // Submit handler
  const handleSubmit = async (data: PurchaseOrderFormData) => {
    try {
      const orderData: CreatePurchaseOrderData = {
        profileId,
        supplierId: data.supplierId,
        orderNumber: data.orderNumber,
        expectedDate: data.expectedDate || undefined,
        notes: data.notes,
        items: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          notes: item.notes,
        })),
      };

      await createPurchaseOrder.mutateAsync(orderData);
      navigate("/dashboard/purchase-orders");
    } catch (error) {
      console.error("Error creating purchase order:", error);
    }
  };

  // Save as draft handler
  const handleSaveDraft = async () => {
    await handleSubmit(form.getValues());
  };

  // Get available products (not in the list yet)
  const getAvailableProducts = (currentIndex: number) => {
    const currentItems = form.getValues("items");
    const usedProductIds = currentItems
      .filter((_, idx) => idx !== currentIndex)
      .map((item) => item.productId)
      .filter(Boolean);

    return products?.filter((p) => !usedProductIds.includes(p.id)) || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/purchase-orders")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Nueva Orden de Compra</h1>
            <p className="text-muted-foreground">Crea una nueva orden de compra a proveedor</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createPurchaseOrder.isPending}
          >
            {createPurchaseOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Borrador
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle>Información de la Orden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Form {...form}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proveedor *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona proveedor" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {suppliers?.map((sup) => (
                              <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="orderNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Orden</FormLabel>
                        <FormControl>
                          <Input placeholder="OC-001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="expectedDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha Esperada</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Notas</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Notas adicionales..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Form>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Productos</CardTitle>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: "", quantity: 1, unitPrice: 0, notes: "" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Producto
              </Button>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Agrega productos a la orden
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => {
                    const availableProducts = getAvailableProducts(index);
                    const items = form.watch("items");
                    const currentItem = items[index];

                    return (
                      <div key={field.id} className="flex flex-col md:flex-row gap-4 p-4 border rounded-lg">
                        <div className="flex-1">
                          <FormField
                            control={form.control}
                            name={`items.${index}.productId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : ""}>Producto</FormLabel>
                                <Select
                                  onValueChange={(val) => {
                                    field.onChange(val);
                                    handleProductSelect(index, val);
                                  }}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecciona producto" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {availableProducts.map((product) => (
                                      <SelectItem key={product.id} value={product.id}>
                                        {product.name} ({product.sku})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="w-full md:w-32">
                          <FormField
                            control={form.control}
                            name={`items.${index}.quantity`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : ""}>Cantidad</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="w-full md:w-32">
                          <FormField
                            control={form.control}
                            name={`items.${index}.unitPrice`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className={index > 0 ? "sr-only" : ""}>Precio Unit.</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    {...field}
                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="w-full md:w-32 flex items-end">
                          <div className="text-right font-medium w-full">
                            ${((currentItem?.quantity || 0) * (currentItem?.unitPrice || 0)).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center justify-end md:justify-center">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA (16%)</span>
                <span className="font-medium">${totals.tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-4 flex justify-between">
                <span className="font-bold">Total</span>
                <span className="font-bold text-lg">${totals.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                onClick={form.handleSubmit(handleSubmit)}
                disabled={createPurchaseOrder.isPending}
              >
                {createPurchaseOrder.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Crear y Enviar
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/dashboard/purchase-orders")}
              >
                Cancelar
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
