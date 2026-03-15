import { useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router";
import { useProfile } from "@/hooks/use-profile";
import {
  useStaffMember,
  useUpdateStaff,
  useDeleteStaff,
  useStaffAvailability,
  useSetStaffAvailabilities,
  useStaffServices,
  useReplaceStaffServices,
  type SetAvailabilityData,
} from "@/hooks/use-staff";
import { Loader2, ArrowLeft, Pencil, Trash2, Calendar, Clock, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

// Days of week in Spanish
const daysOfWeek = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

// Role badge colors
const roleColors = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  staff: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

// Role labels in Spanish
const roleLabels = {
  admin: "Administrador",
  manager: "Gerente",
  staff: "Personal",
};

// Staff form validation schema
const staffSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.enum(["admin", "manager", "staff"]),
  isActive: z.boolean(),
});

type StaffFormData = z.infer<typeof staffSchema>;

// Availability form schema
const availabilitySchema = z.object({
  availabilities: z.array(
    z.object({
      dayOfWeek: z.number(),
      startTime: z.string().min(5, "Hora de inicio requerida"),
      endTime: z.string().min(5, "Hora de fin requerida"),
      isAvailable: z.boolean(),
    })
  ),
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

export function StaffDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { profile } = useProfile();
  const profileId = profile?.id || "";
  const staffId = id || "";

  const { data: staff, isLoading } = useStaffMember(staffId, profileId);
  const { data: services } = useStaffServices(staffId, profileId);
  const { data: availabilities } = useStaffAvailability(staffId, profileId);
  
  const updateStaff = useUpdateStaff();
  const deleteStaff = useDeleteStaff();
  const setAvailabilities = useSetStaffAvailabilities();
  const replaceServices = useReplaceStaffServices();

  // State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isServiceSelectOpen, setIsServiceSelectOpen] = useState(false);

  // Staff form
  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "staff",
      isActive: true,
    },
  });

  // Initialize form with staff data when loaded
  useMemo(() => {
    if (staff) {
      staffForm.reset({
        name: staff.name,
        email: staff.email || "",
        phone: staff.phone || "",
        role: staff.role,
        isActive: staff.isActive,
      });
    }
  }, [staff]);

  // Availability form
  const availabilityForm = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      availabilities: daysOfWeek.map((day) => {
        const existing = availabilities?.find((a) => a.dayOfWeek === day.value);
        return {
          dayOfWeek: day.value,
          startTime: existing?.startTime || "09:00",
          endTime: existing?.endTime || "18:00",
          isAvailable: existing?.isAvailable ?? true,
        };
      }),
    },
  });

  // Update availability form when availabilities change
  useMemo(() => {
    if (availabilities) {
      availabilityForm.reset({
        availabilities: daysOfWeek.map((day) => {
          const existing = availabilities.find((a) => a.dayOfWeek === day.value);
          return {
            dayOfWeek: day.value,
            startTime: existing?.startTime || "09:00",
            endTime: existing?.endTime || "18:00",
            isAvailable: existing?.isAvailable ?? true,
          };
        }),
      });
    }
  }, [availabilities]);

  // Handle edit staff
  const handleEditStaff = async (data: StaffFormData) => {
    try {
      await updateStaff.mutateAsync({
        id: staffId,
        data: {
          name: data.name,
          email: data.email || undefined,
          phone: data.phone || undefined,
          role: data.role,
          isActive: data.isActive,
        },
      });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error updating staff:", error);
    }
  };

  // Handle delete staff
  const handleDeleteStaff = async () => {
    try {
      await deleteStaff.mutateAsync({
        id: staffId,
        profileId,
      });
      navigate("/dashboard/staff");
    } catch (error) {
      console.error("Error deleting staff:", error);
    }
  };

  // Handle availability save
  const handleSaveAvailability = async (data: AvailabilityFormData) => {
    try {
      await setAvailabilities.mutateAsync({
        staffId,
        availabilities: data.availabilities.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
          isAvailable: a.isAvailable,
        })),
        profileId,
      });
    } catch (error) {
      console.error("Error saving availability:", error);
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

  if (!staff) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Miembro del personal no encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/staff")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {staff.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">{staff.name}</h1>
              <div className="flex items-center gap-2">
                <Badge className={roleColors[staff.role]}>
                  {roleLabels[staff.role]}
                </Badge>
                <Badge variant={staff.isActive ? "default" : "secondary"}>
                  {staff.isActive ? "Activo" : "Inactivo"}
                </Badge>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditModalOpen(true)}>
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
          <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
          <TabsTrigger value="services">Servicios</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Información del Miembro</CardTitle>
              <CardDescription>
                Datos de contacto y información general
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Nombre</label>
                  <p className="text-lg">{staff.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rol</label>
                  <p className="text-lg">{roleLabels[staff.role]}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg">{staff.email || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Teléfono</label>
                  <p className="text-lg">{staff.phone || "-"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Estado</label>
                  <p className="text-lg">{staff.isActive ? "Activo" : "Inactivo"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Fecha de creación</label>
                  <p className="text-lg">
                    {new Date(staff.createdAt).toLocaleDateString("es-MX", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Availability Tab */}
        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>Horario de Trabajo</CardTitle>
              <CardDescription>
                Configura los días y horarios de disponibilidad
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...availabilityForm}>
                <form
                  onSubmit={availabilityForm.handleSubmit(handleSaveAvailability)}
                  className="space-y-4"
                >
                  {daysOfWeek.map((day) => {
                    const dayIndex = day.value - 1;
                    return (
                      <div
                        key={day.value}
                        className="flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-lg border"
                      >
                        <div className="w-32">
                          <span className="font-medium">{day.label}</span>
                        </div>
                        <FormField
                          control={availabilityForm.control}
                          name={`availabilities.${dayIndex}.isAvailable`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center gap-2">
                              <FormControl>
                                <input
                                  type="checkbox"
                                  checked={field.value}
                                  onChange={field.onChange}
                                  className="h-5 w-5"
                                />
                              </FormControl>
                              <FormLabel className="mb-0">Disponible</FormLabel>
                            </FormItem>
                          )}
                        />
                        <div className="flex items-center gap-2 flex-1">
                          <FormField
                            control={availabilityForm.control}
                            name={`availabilities.${dayIndex}.startTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="time"
                                    className="w-32"
                                    disabled={!availabilityForm.watch(`availabilities.${dayIndex}.isAvailable`)}
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <span className="text-muted-foreground">a</span>
                          <FormField
                            control={availabilityForm.control}
                            name={`availabilities.${dayIndex}.endTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="time"
                                    className="w-32"
                                    disabled={!availabilityForm.watch(`availabilities.${dayIndex}.isAvailable`)}
                                    {...field}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    type="submit"
                    disabled={setAvailabilities.isPending}
                    className="w-full md:w-auto"
                  >
                    {setAvailabilities.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar Horario
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Servicios Asignados</CardTitle>
              <CardDescription>
                Servicios que este miembro puede prestar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {services && services.length > 0 ? (
                <div className="space-y-2">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">{service.service?.name || "Servicio"}</p>
                        {service.service?.description && (
                          <p className="text-sm text-muted-foreground">
                            {service.service.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">
                        ${service.service?.price || "0"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No hay servicios asignados a este miembro
                </p>
              )}
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Para asignar servicios, contacta al administrador del sistema
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Miembro</DialogTitle>
            <DialogDescription>
              Actualiza los datos del miembro del personal
            </DialogDescription>
          </DialogHeader>
          <Form {...staffForm}>
            <form onSubmit={staffForm.handleSubmit(handleEditStaff)} className="space-y-4">
              <FormField
                control={staffForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre *</FormLabel>
                    <FormControl>
                      <Input placeholder="Nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={staffForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rol</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        {...field}
                      >
                        <option value="staff">Personal</option>
                        <option value="manager">Gerente</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={staffForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-5 w-5"
                      />
                    </FormControl>
                    <FormLabel className="mb-0">Miembro activo</FormLabel>
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={staffForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@ejemplo.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={staffForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="+52 555 123 4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateStaff.isPending}>
                  {updateStaff.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar Cambios
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
            <DialogTitle>Eliminar Miembro</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{staff.name}</strong>? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteStaff}
              disabled={deleteStaff.isPending}
            >
              {deleteStaff.isPending && (
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
