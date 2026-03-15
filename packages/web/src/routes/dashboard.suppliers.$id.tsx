import { useParams, useNavigate } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import { useSupplier, useSupplierProducts, type SupplierProductWithProduct } from "@/hooks/use-inventory";
import { Loader2, ArrowLeft, Phone, Mail, MapPin, FileText, Package, Clock, Tag, DollarSign, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

export function SupplierDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useProfile();
  const profileId = profile?.id || "";
  const supplierId = id || "";

  const { supplier, isLoading: isSupplierLoading, refetch: refetchSupplier } = useSupplier(profileId, supplierId);
  const { supplierProducts, isLoading: isProductsLoading, refetch: refetchProducts } = useSupplierProducts(profileId, supplierId);

  const isLoading = isSupplierLoading || isProductsLoading;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error state
  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">Proveedor no encontrado</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/suppliers")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a proveedores
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/suppliers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{supplier.name}</h1>
              {supplier.isActive ? (
                <Badge variant="default">Activo</Badge>
              ) : (
                <Badge variant="destructive">Inactivo</Badge>
              )}
            </div>
            <p className="text-muted-foreground">Detalles del proveedor</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Information */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Información de Contacto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Person */}
              {supplier.contactPerson && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Persona de contacto</p>
                    <p className="text-sm">{supplier.contactPerson}</p>
                  </div>
                </div>
              )}

              {/* Phone */}
              {supplier.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Teléfono</p>
                    <p className="text-sm">{supplier.phone}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              {supplier.email && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Email</p>
                    <p className="text-sm">{supplier.email}</p>
                  </div>
                </div>
              )}

              {/* Address */}
              {supplier.address && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Dirección</p>
                    <p className="text-sm">
                      {supplier.address}
                      {supplier.city && `, ${supplier.city}`}
                      {supplier.country && `, ${supplier.country}`}
                    </p>
                  </div>
                </div>
              )}

              {/* Tax ID */}
              {supplier.taxId && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Tag className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">RFC</p>
                    <p className="text-sm">{supplier.taxId}</p>
                  </div>
                </div>
              )}

              {/* Payment Terms */}
              {supplier.paymentTerms && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Condiciones de pago</p>
                    <p className="text-sm">{supplier.paymentTerms}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            {supplier.notes && (
              <>
                <Separator className="my-6" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Notas</p>
                  <p className="text-sm">{supplier.notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Productos asociados</span>
                </div>
                <span className="text-sm font-medium">{supplierProducts?.length || 0}</span>
              </div>
              
              <Separator />
              
              <div className="text-xs text-muted-foreground">
                <p>Creado: {new Date(supplier.createdAt).toLocaleDateString("es-MX")}</p>
                <p>Actualizado: {new Date(supplier.updatedAt).toLocaleDateString("es-MX")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            Productos Asociados
          </CardTitle>
        </CardHeader>
        <CardContent>
          {supplierProducts && supplierProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>SKU Proveedor</TableHead>
                  <TableHead>Precio Costo</TableHead>
                  <TableHead>Tiempo Entrega</TableHead>
                  <TableHead>Mín. Orden</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplierProducts.map((sp: SupplierProductWithProduct) => (
                  <TableRow 
                    key={sp.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/dashboard/inventory?product=${sp.product.id}`)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{sp.product.name}</span>
                        <span className="text-xs text-muted-foreground">SKU: {sp.product.sku}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {sp.supplierSku ? (
                        <Badge variant="outline">{sp.supplierSku}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sp.costPrice ? (
                        <span>${Number(sp.costPrice).toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sp.leadTimeDays ? (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{sp.leadTimeDays} días</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sp.minOrderQty ? (
                        <span>{sp.minOrderQty}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sp.isPrimary && (
                        <Badge>Principal</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No hay productos asociados</p>
              <p className="text-sm text-muted-foreground">
                Asocia productos a este proveedor desde la página de productos
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default SupplierDetailPage;
