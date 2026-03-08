import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import { usePurchaseOrders, type PurchaseOrder, type PurchaseOrderStatus } from "@/hooks/use-purchase-orders";
import { Loader2, Plus, FileText, Send, Package, XCircle, Search, Eye, Trash2 } from "lucide-react";

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

// Status labels in Spanish
const statusLabels: Record<PurchaseOrderStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" }> = {
  draft: { label: "Borrador", variant: "secondary" },
  sent: { label: "Enviada", variant: "default" },
  partial: { label: "Parcial", variant: "outline" },
  received: { label: "Recibida", variant: "success" },
  cancelled: { label: "Cancelada", variant: "destructive" },
};

// Format date
const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// Format currency
const formatCurrency = (amount: string | number) => {
  return `$${Number(amount).toFixed(2)}`;
};

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const profileId = profile?.id || "";

  const { purchaseOrders, isLoading, deletePurchaseOrder } = usePurchaseOrders(profileId);

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);

  // Get unique suppliers from orders
  const suppliers = useMemo(() => {
    if (!purchaseOrders) return [];
    const supplierMap = new Map<string, { id: string; name: string }>();
    purchaseOrders.forEach((order) => {
      if (order.supplier && !supplierMap.has(order.supplier.id)) {
        supplierMap.set(order.supplier.id, order.supplier);
      }
    });
    return Array.from(supplierMap.values());
  }, [purchaseOrders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    if (!purchaseOrders) return [];

    return purchaseOrders.filter((order) => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        searchTerm === "" ||
        order.orderNumber?.toLowerCase().includes(searchLower) ||
        order.supplier?.name.toLowerCase().includes(searchLower) ||
        order.notes?.toLowerCase().includes(searchLower);

      // Status filter
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      // Supplier filter
      const matchesSupplier =
        supplierFilter === "all" || order.supplierId === supplierFilter;

      return matchesSearch && matchesStatus && matchesSupplier;
    });
  }, [purchaseOrders, searchTerm, statusFilter, supplierFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!purchaseOrders) return { total: 0, pending: 0, partial: 0, received: 0 };
    return {
      total: purchaseOrders.length,
      pending: purchaseOrders.filter((o) => o.status === "draft" || o.status === "sent").length,
      partial: purchaseOrders.filter((o) => o.status === "partial").length,
      received: purchaseOrders.filter((o) => o.status === "received").length,
    };
  }, [purchaseOrders]);

  // Handlers
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return;

    try {
      await deletePurchaseOrder.mutateAsync(orderToDelete.id);
      setIsDeleteDialogOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error("Error deleting order:", error);
    }
  };

  const confirmDelete = (order: PurchaseOrder) => {
    setOrderToDelete(order);
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
          <h1 className="text-2xl font-bold">Órdenes de Compra</h1>
          <p className="text-muted-foreground">Gestiona tus órdenes de compra a proveedores</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/dashboard/inventory")}>
            Inventario
          </Button>
          <Button variant="outline" onClick={() => navigate("/dashboard/suppliers")}>
            Proveedores
          </Button>
          <Button onClick={() => navigate("/dashboard/purchase-orders/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Orden
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parciales</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.partial}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recibidas</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.received}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de orden o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="draft">Borrador</SelectItem>
            <SelectItem value="sent">Enviada</SelectItem>
            <SelectItem value="partial">Parcial</SelectItem>
            <SelectItem value="received">Recibida</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <Select value={supplierFilter} onValueChange={setSupplierFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Proveedor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los proveedores</SelectItem>
            {suppliers.map((sup) => (
              <SelectItem key={sup.id} value={sup.id}>{sup.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Fecha Esperada</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No se encontraron órdenes de compra
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((order) => {
                  const statusConfig = statusLabels[order.status];
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm">
                        {order.orderNumber || order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {order.supplier?.name || "-"}
                      </TableCell>
                      <TableCell>{formatDate(order.expectedDate)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusConfig.variant}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/dashboard/purchase-orders/${order.id}`)}
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === "draft" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => confirmDelete(order)}
                              title="Eliminar"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar Orden de Compra</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la orden de compra{" "}
              <strong>{orderToDelete?.orderNumber || orderToDelete?.id.slice(0, 8)}</strong>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              disabled={deletePurchaseOrder.isPending}
            >
              {deletePurchaseOrder.isPending && (
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
