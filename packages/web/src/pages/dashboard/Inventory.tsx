import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import {
  useInventoryProducts,
  useStockAdjustment,
  useLowStockProducts,
  useInventoryValue,
  useProductCategories,
  useSuppliers,
  type Product,
  type StockAdjustmentData,
} from "@/hooks/use-inventory";
import { Loader2, Plus, Package, AlertTriangle, TrendingUp, Pencil, Trash2, ArrowUpDown, Search, Filter, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

// Product form validation schema
const productSchema = z.object({
  sku: z.string().min(1, "El SKU es requerido"),
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.union([z.number().min(0, "El precio debe ser positivo"), z.string()]).transform(val => Number(val)),
  cost: z.union([z.number().min(0, "El costo debe ser positivo"), z.string(), z.undefined()]).optional().transform(val => val !== undefined ? Number(val) : undefined),
  unit: z.string().default("piece"),
  minStock: z.number().min(0).default(0),
  categoryId: z.string().optional(),
  supplierId: z.string().optional(),
  barcode: z.string().optional(),
  hasExpiration: z.boolean().default(false),
  expirationDays: z.number().min(0).optional(),
  brand: z.string().optional(),
  notes: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

// Stock adjustment schema
const stockAdjustmentSchema = z.object({
  quantity: z.number().int().min(1, "La cantidad debe ser al menos 1"),
  reason: z.enum(["purchase", "sale", "damage", "return", "adjustment", "initial", "transfer", "expired"], {
    errorMap: () => ({ message: "Selecciona un motivo" }),
  }),
  notes: z.string().optional(),
  location: z.string().default("default"),
});

type StockAdjustmentFormData = z.infer<typeof stockAdjustmentSchema>;

// Reason labels in Spanish
const reasonLabels: Record<string, string> = {
  purchase: "Compra",
  sale: "Venta",
  damage: "Daño",
  return: "Devolución",
  adjustment: "Ajuste",
  initial: "Stock inicial",
  transfer: "Transferencia",
  expired: "Vencido",
};

export function InventoryPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const profileId = profile?.id || "";

  const { products, isLoading, createProduct, updateProduct, deleteProduct } = useInventoryProducts(profileId);
  const { adjustStock } = useStockAdjustment(profileId);
  const { lowStockProducts } = useLowStockProducts(profileId);
  const { inventoryValue } = useInventoryValue(profileId);
  const { categories } = useProductCategories(profileId);
  const { suppliers } = useSuppliers(profileId);

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Product form
  const productForm = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: "",
      name: "",
      description: "",
      price: 0,
      cost: undefined,
      unit: "piece",
      minStock: 0,
      categoryId: undefined,
      supplierId: undefined,
      barcode: "",
      hasExpiration: false,
      expirationDays: undefined,
      brand: "",
      notes: "",
    },
  });

  // Stock adjustment form
  const stockForm = useForm<StockAdjustmentFormData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      quantity: 1,
      reason: "adjustment",
      notes: "",
      location: "default",
    },
  });

  // Filter products
  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        (product.barcode?.toLowerCase().includes(searchLower) ?? false);

      // Category filter
      const matchesCategory =
        categoryFilter === "all" || product.categoryId === categoryFilter;

      // Supplier filter
      const matchesSupplier =
        supplierFilter === "all" || product.supplierId === supplierFilter;

      // Stock filter
      const currentStock = product.inventoryItem?.quantity || 0;
      let matchesStock = true;
      if (stockFilter === "low") {
        matchesStock = currentStock <= (product.minStock || 0);
      } else if (stockFilter === "normal") {
        matchesStock = currentStock > (product.minStock || 0);
      } else if (stockFilter === "out") {
        matchesStock = currentStock === 0;
      }

      return matchesSearch && matchesCategory && matchesSupplier && matchesStock;
    });
  }, [products, searchTerm, categoryFilter, supplierFilter, stockFilter]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // Handlers
  const handleOpenProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      productForm.reset({
        sku: product.sku,
        name: product.name,
        description: product.description || "",
        price: Number(product.price),
        cost: product.cost ? Number(product.cost) : undefined,
        unit: product.unit,
        minStock: product.minStock,
        categoryId: product.categoryId || undefined,
        supplierId: product.supplierId || undefined,
        barcode: product.barcode || "",
        hasExpiration: product.hasExpiration,
        expirationDays: product.expirationDays || undefined,
        brand: product.brand || "",
        notes: product.notes || "",
      });
    } else {
      setEditingProduct(null);
      productForm.reset({
        sku: "",
        name: "",
        description: "",
        price: 0,
        cost: undefined,
        unit: "piece",
        minStock: 0,
        categoryId: undefined,
        supplierId: undefined,
        barcode: "",
        hasExpiration: false,
        expirationDays: undefined,
        brand: "",
        notes: "",
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSubmitProduct = async (data: ProductFormData) => {
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({ id: editingProduct.id, data });
      } else {
        await createProduct.mutateAsync(data);
      }
      setIsProductModalOpen(false);
      productForm.reset();
    } catch (error) {
      console.error("Error saving product:", error);
    }
  };

  const handleOpenStockModal = (product: Product) => {
    setSelectedProduct(product);
    stockForm.reset({
      quantity: 1,
      reason: "adjustment",
      notes: "",
      location: product.inventoryItem?.location || "default",
    });
    setIsStockModalOpen(true);
  };

  const handleSubmitStock = async (data: StockAdjustmentFormData) => {
    if (!selectedProduct) return;

    try {
      const adjustmentData: StockAdjustmentData = {
        productId: selectedProduct.id,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
        location: data.location,
      };
      await adjustStock.mutateAsync(adjustmentData);
      setIsStockModalOpen(false);
      stockForm.reset();
    } catch (error) {
      console.error("Error adjusting stock:", error);
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct.mutateAsync(productToDelete.id);
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const confirmDelete = (product: Product) => {
    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inventario</h1>
          <p className="text-muted-foreground">Gestiona tus productos y stock</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/suppliers")}>
            Proveedores
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/purchase-orders")}>
            Órdenes de Compra
          </Button>
          <Button onClick={() => handleOpenProductModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockProducts?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${inventoryValue?.totalValue?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, SKU o código de barras..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(val) => { setCategoryFilter(val); setCurrentPage(1); }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={supplierFilter} onValueChange={(val) => { setSupplierFilter(val); setCurrentPage(1); }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {suppliers?.map((sup) => (
              <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={stockFilter} onValueChange={(val) => { setStockFilter(val); setCurrentPage(1); }}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Stock" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo el stock</SelectItem>
            <SelectItem value="low">Stock bajo</SelectItem>
            <SelectItem value="normal">Stock normal</SelectItem>
            <SelectItem value="out">Sin stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProducts.map((product) => {
                  const stock = product.inventoryItem?.quantity || 0;
                  const isLowStock = stock <= (product.minStock || 0);
                  const isOutOfStock = stock === 0;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.category ? (
                          <Badge variant="outline">{product.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">${Number(product.price).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={isOutOfStock ? "text-red-500 font-medium" : isLowStock ? "text-amber-500 font-medium" : ""}>
                            {stock}
                          </span>
                          {isLowStock && (
                            <Badge variant={isOutOfStock ? "destructive" : "secondary"}>
                              {isOutOfStock ? "Sin stock" : "Bajo"}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.supplier ? (
                          <span>{product.supplier.name}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenStockModal(product)}
                            title="Ajustar stock"
                          >
                            <ArrowUpDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenProductModal(product)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => confirmDelete(product)}
                            title="Eliminar"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {(currentPage - 1) * itemsPerPage + 1} a{" "}
            {Math.min(currentPage * itemsPerPage, filteredProducts.length)} de{" "}
            {filteredProducts.length} productos
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Product Modal */}
      <Dialog open={isProductModalOpen} onOpenChange={setIsProductModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Actualiza los datos del producto"
                : "Agrega un nuevo producto al inventario"}
            </DialogDescription>
          </DialogHeader>
          <Form {...productForm}>
            <form onSubmit={productForm.handleSubmit(handleSubmitProduct)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="sku"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU *</FormLabel>
                      <FormControl>
                        <Input placeholder="SKU-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del producto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={productForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Descripción del producto" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={productForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Precio *</FormLabel>
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
                <FormField
                  control={productForm.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Costo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="unit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidad</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona unidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="piece">Pieza</SelectItem>
                          <SelectItem value="kg">Kilogramo</SelectItem>
                          <SelectItem value="g">Gramo</SelectItem>
                          <SelectItem value="liter">Litro</SelectItem>
                          <SelectItem value="ml">Mililitro</SelectItem>
                          <SelectItem value="box">Caja</SelectItem>
                          <SelectItem value="pack">Paquete</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={productForm.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={productForm.control}
                  name="barcode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de barras</FormLabel>
                      <FormControl>
                        <Input placeholder="Código de barras" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marca</FormLabel>
                      <FormControl>
                        <Input placeholder="Marca" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={productForm.control}
                  name="minStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock mínimo</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
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

              <FormField
                control={productForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas adicionales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsProductModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                  {(createProduct.isPending || updateProduct.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingProduct ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Stock Adjustment Modal */}
      <Dialog open={isStockModalOpen} onOpenChange={setIsStockModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ajustar Stock</DialogTitle>
            <DialogDescription>
              {selectedProduct && (
                <span className="text-foreground">
                  Producto: <strong>{selectedProduct.name}</strong>
                  <br />
                  Stock actual: <strong>{selectedProduct.inventoryItem?.quantity || 0}</strong>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...stockForm}>
            <form onSubmit={stockForm.handleSubmit(handleSubmitStock)} className="space-y-4">
              <FormField
                control={stockForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
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

              <FormField
                control={stockForm.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona motivo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(reasonLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={stockForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Notas adicionales" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsStockModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={adjustStock.isPending}>
                  {adjustStock.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Ajustar Stock
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Producto</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar el producto{" "}
              <strong>{productToDelete?.name}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteProduct}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
