import { useState } from "react";
import { useNavigate } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import {
  usePackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage,
  useMemberships,
  useCreateMembership,
  useUpdateMembership,
  useDeleteMembership,
  type ServicePackage,
  type Membership,
} from "@/hooks/use-packages";
import { Loader2, Plus, Pencil, Trash2, Search, Package, CreditCard, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Package form validation schema
const packageSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  totalSessions: z.number().min(1, "Debe tener al menos 1 sesión"),
  discountPercent: z.number().min(0).max(100).optional(),
  validityDays: z.number().min(1).optional(),
});

type PackageFormData = z.infer<typeof packageSchema>;

// Membership form validation schema
const membershipSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  price: z.string().min(1, "El precio es requerido"),
  billingPeriod: z.enum(["weekly", "biweekly", "monthly", "quarterly", "yearly"]),
  includedSessions: z.number().min(0).optional(),
  discountPercent: z.number().min(0).max(100).optional(),
  unlimitedSessions: z.boolean().optional(),
});

type MembershipFormData = z.infer<typeof membershipSchema>;

// Billing period labels
const billingPeriodLabels: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quincenal",
  monthly: "Mensual",
  quarterly: "Trimestral",
  yearly: "Anual",
};

export function PackagesPage() {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const profileId = profile?.id || "";

  const { packages, isLoading: isLoadingPackages } = usePackages(profileId);
  const { memberships, isLoading: isLoadingMemberships } = useMemberships(profileId);
  const createPackage = useCreatePackage();
  const updatePackage = useUpdatePackage();
  const deletePackage = useDeletePackage();
  const createMembership = useCreateMembership();
  const updateMembership = useUpdateMembership();
  const deleteMembership = useDeleteMembership();

  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: "package" | "membership"; item: ServicePackage | Membership } | null>(null);

  // Package form
  const packageForm = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      totalSessions: 1,
      discountPercent: 0,
      validityDays: undefined,
    },
  });

  // Membership form
  const membershipForm = useForm<MembershipFormData>({
    resolver: zodResolver(membershipSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      billingPeriod: "monthly",
      includedSessions: 0,
      discountPercent: 0,
      unlimitedSessions: false,
    },
  });

  // Filtered packages
  const filteredPackages = packages?.filter(
    (pkg) =>
      pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pkg.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Filtered memberships
  const filteredMemberships = memberships?.filter(
    (mem) =>
      mem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mem.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Handlers
  const handleOpenPackageModal = (pkg?: ServicePackage) => {
    if (pkg) {
      setEditingPackage(pkg);
      packageForm.reset({
        name: pkg.name,
        description: pkg.description || "",
        price: pkg.price,
        totalSessions: pkg.totalSessions,
        discountPercent: pkg.discountPercent || undefined,
        validityDays: pkg.validityDays || undefined,
      });
    } else {
      setEditingPackage(null);
      packageForm.reset({
        name: "",
        description: "",
        price: "",
        totalSessions: 1,
        discountPercent: 0,
        validityDays: undefined,
      });
    }
    setIsPackageModalOpen(true);
  };

  const handleOpenMembershipModal = (mem?: Membership) => {
    if (mem) {
      setEditingMembership(mem);
      membershipForm.reset({
        name: mem.name,
        description: mem.description || "",
        price: mem.price,
        billingPeriod: mem.billingPeriod,
        includedSessions: mem.includedSessions || 0,
        discountPercent: mem.discountPercent || 0,
        unlimitedSessions: mem.unlimitedSessions,
      });
    } else {
      setEditingMembership(null);
      membershipForm.reset({
        name: "",
        description: "",
        price: "",
        billingPeriod: "monthly",
        includedSessions: 0,
        discountPercent: 0,
        unlimitedSessions: false,
      });
    }
    setIsMembershipModalOpen(true);
  };

  const handleDeleteClick = (type: "package" | "membership", item: ServicePackage | Membership) => {
    setItemToDelete({ type, item });
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === "package") {
      await deletePackage.mutateAsync({ 
        id: itemToDelete.item.id, 
        profileId 
      });
    } else {
      await deleteMembership.mutateAsync({ 
        id: itemToDelete.item.id, 
        profileId 
      });
    }

    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const onSubmitPackage = async (data: PackageFormData) => {
    if (editingPackage) {
      await updatePackage.mutateAsync({
        id: editingPackage.id,
        data,
      });
    } else {
      await createPackage.mutateAsync({
        ...data,
        profileId,
      });
    }
    setIsPackageModalOpen(false);
    setEditingPackage(null);
  };

  const onSubmitMembership = async (data: MembershipFormData) => {
    if (editingMembership) {
      await updateMembership.mutateAsync({
        id: editingMembership.id,
        data,
      });
    } else {
      await createMembership.mutateAsync({
        ...data,
        profileId,
      });
    }
    setIsMembershipModalOpen(false);
    setEditingMembership(null);
  };

  if (isLoadingPackages || isLoadingMemberships) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Paquetes y Membresías</h1>
          <p className="text-muted-foreground">
            Gestiona los paquetes de servicios y las membresías de tu negocio
          </p>
        </div>
      </div>

      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="packages" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Paquetes
          </TabsTrigger>
          <TabsTrigger value="memberships" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Membresías
          </TabsTrigger>
        </TabsList>

        {/* Packages Tab */}
        <TabsContent value="packages">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Paquetes de Servicios</CardTitle>
              <Button onClick={() => handleOpenPackageModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Paquete
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Input
                  placeholder="Buscar paquetes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Sesiones</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Validez</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPackages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay paquetes todavía. Crea tu primer paquete.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPackages.map((pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell className="font-medium">{pkg.name}</TableCell>
                        <TableCell>${pkg.price}</TableCell>
                        <TableCell>{pkg.totalSessions}</TableCell>
                        <TableCell>
                          {pkg.discountPercent ? `${pkg.discountPercent}%` : "-"}
                        </TableCell>
                        <TableCell>
                          {pkg.validityDays ? `${pkg.validityDays} días` : "Sin límite"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={pkg.isActive ? "default" : "secondary"}>
                            {pkg.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenPackageModal(pkg)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick("package", pkg)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Memberships Tab */}
        <TabsContent value="memberships">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Membresías</CardTitle>
              <Button onClick={() => handleOpenMembershipModal()}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Membresía
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <Input
                  placeholder="Buscar membresías..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Sesiones Incluidas</TableHead>
                    <TableHead>Descuento</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMemberships.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hay membresías todavía. Crea tu primera membresía.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMemberships.map((mem) => (
                      <TableRow key={mem.id}>
                        <TableCell className="font-medium">{mem.name}</TableCell>
                        <TableCell>${mem.price}</TableCell>
                        <TableCell>{billingPeriodLabels[mem.billingPeriod]}</TableCell>
                        <TableCell>
                          {mem.unlimitedSessions ? (
                            <Badge variant="default">Ilimitadas</Badge>
                          ) : (
                            mem.includedSessions || 0
                          )}
                        </TableCell>
                        <TableCell>
                          {mem.discountPercent ? `${mem.discountPercent}%` : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant={mem.isActive ? "default" : "secondary"}>
                            {mem.isActive ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenMembershipModal(mem)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick("membership", mem)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Package Modal */}
      <Dialog open={isPackageModalOpen} onOpenChange={setIsPackageModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPackage ? "Editar Paquete" : "Nuevo Paquete"}
            </DialogTitle>
            <DialogDescription>
              {editingPackage
                ? "Actualiza los datos del paquete"
                : "Crea un nuevo paquete de servicios"}
            </DialogDescription>
          </DialogHeader>

          <Form {...packageForm}>
            <form onSubmit={packageForm.handleSubmit(onSubmitPackage)} className="space-y-4">
              <FormField
                control={packageForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Paquete Premium" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={packageForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción del paquete" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={packageForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input placeholder="99.99" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={packageForm.control}
                name="totalSessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sesiones</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={packageForm.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descuento (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={packageForm.control}
                name="validityDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Días de validez</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Sin límite"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPackageModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createPackage.isPending || updatePackage.isPending}>
                  {createPackage.isPending || updatePackage.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingPackage ? (
                    "Actualizar"
                  ) : (
                    "Crear"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Membership Modal */}
      <Dialog open={isMembershipModalOpen} onOpenChange={setIsMembershipModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMembership ? "Editar Membresía" : "Nueva Membresía"}
            </DialogTitle>
            <DialogDescription>
              {editingMembership
                ? "Actualiza los datos de la membresía"
                : "Crea una nueva membresía"}
            </DialogDescription>
          </DialogHeader>

          <Form {...membershipForm}>
            <form onSubmit={membershipForm.handleSubmit(onSubmitMembership)} className="space-y-4">
              <FormField
                control={membershipForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Membresía Gold" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={membershipForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Input placeholder="Descripción de la membresía" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={membershipForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio</FormLabel>
                    <FormControl>
                      <Input placeholder="99.99" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={membershipForm.control}
                name="billingPeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período de facturación</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="weekly">Semanal</option>
                        <option value="biweekly">Quincenal</option>
                        <option value="monthly">Mensual</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="yearly">Anual</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={membershipForm.control}
                name="includedSessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sesiones incluidas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={membershipForm.control}
                name="discountPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descuento en servicios extra (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={membershipForm.control}
                name="unlimitedSessions"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="h-4 w-4"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Sesiones ilimitadas</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsMembershipModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMembership.isPending || updateMembership.isPending}
                >
                  {createMembership.isPending || updateMembership.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : editingMembership ? (
                    "Actualizar"
                  ) : (
                    "Crear"
                  )}
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
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar{" "}
              <span className="font-medium">{itemToDelete?.item.name}</span>
              ? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deletePackage.isPending || deleteMembership.isPending}
            >
              {(deletePackage.isPending || deleteMembership.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
