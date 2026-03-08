import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AssetSelector } from "@/components/forms/asset-selector";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { useInventoryProducts, type Product } from "@/hooks/use-inventory";
import { useMedicalServiceProducts, type ServiceProductWithProduct } from "@/hooks/use-service-products";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";
import type { ServiceFormProps } from "../types";

export function ServiceForm({ form, profileId, mode = "create" }: ServiceFormProps) {
  // Get products from inventory
  const { products, isLoading: productsLoading } = useInventoryProducts(profileId);
  
  // For edit mode, get existing service-product associations
  const serviceId = form.getValues("id");
  const { serviceProducts, isLoading: serviceProductsLoading } = useMedicalServiceProducts(profileId, serviceId);
  
  // Watch the products field
  const productsField = form.watch("products");

  // Initialize products field in edit mode
  useEffect(() => {
    if (mode === "edit" && serviceProducts && serviceProducts.length > 0 && !productsField) {
      const existingProducts = serviceProducts.map((sp: ServiceProductWithProduct) => ({
        productId: sp.productId,
        quantityRequired: sp.quantityRequired,
        isRequired: sp.isRequired,
      }));
      form.setValue("products", existingProducts);
    }
  }, [mode, serviceProducts, form, productsField]);

  const addProduct = () => {
    const current = form.getValues("products") || [];
    form.setValue("products", [...current, { productId: "", quantityRequired: 1, isRequired: true }]);
  };

  const removeProduct = (index: number) => {
    const current = form.getValues("products") || [];
    const updated = current.filter((_, i) => i !== index);
    form.setValue("products", updated);
  };

  const updateProduct = (index: number, field: string, value: string | number | boolean) => {
    const current = form.getValues("products") || [];
    const updated = [...current];
    updated[index] = { ...updated[index], [field]: value };
    form.setValue("products", updated);
  };

  return (
    <div className="space-y-4">
      <AssetSelector
        name="imageAssetId"
        label="Imagen"
        description="Selecciona una imagen para el servicio"
        type="image"
        userId={profileId}
      />

      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Nombre del servicio *</FormLabel>
            <FormControl>
              <Input placeholder="Consulta general" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Describe brevemente el servicio..."
                rows={3}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="duration"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Duración (minutos) *</FormLabel>
            <FormControl>
              <NumberInput
                type="number"
                placeholder="30"
                value={field.value}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="price"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Precio</FormLabel>
            <FormControl>
              <Input type="number" step="0.01" placeholder="50.00" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Categoría</FormLabel>
            <FormControl>
              <Input placeholder="Medicina general" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="requirements"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Requisitos</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Documentos necesarios..."
                rows={2}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Products Section */}
      <div className="space-y-4 border-t pt-4">
        <div className="flex items-center justify-between">
          <FormLabel>Productos consumidos</FormLabel>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addProduct}
            disabled={productsLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            Agregar producto
          </Button>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Selecciona los productos que se consumen al realizar este servicio
        </p>

        {(productsField || []).map((productEntry, index) => (
          <div key={index} className="flex items-end gap-2 p-3 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <FormField
                control={form.control}
                name={`products.${index}.productId`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Producto</FormLabel>
                    <Select
                      onValueChange={(val) => updateProduct(index, "productId", val)}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un producto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {products?.map((product: Product) => (
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
            
            <div className="w-24">
              <FormField
                control={form.control}
                name={`products.${index}.quantityRequired`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Cantidad</FormLabel>
                    <NumberInput
                      type="number"
                      min={1}
                      placeholder="Cant."
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeProduct(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <FormField
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center gap-2 space-y-0">
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
            <FormLabel>Servicio activo</FormLabel>
          </FormItem>
        )}
      />
    </div>
  );
}
