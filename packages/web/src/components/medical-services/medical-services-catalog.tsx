import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMedicalServices } from "@/hooks/use-medical-services";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { Form } from "@/components/ui/form";
import { Plus } from "lucide-react";
import {
  ServiceCard,
  ServiceForm,
  ServiceEmptyState,
  medicalServiceSchema,
} from ".";
import type { MedicalService } from "@/hooks/use-medical-services";
import type { MedicalServiceFormValues } from "./types";

interface MedicalServicesCatalogProps {
  profileId: string;
}

export function MedicalServicesCatalog({
  profileId,
}: MedicalServicesCatalogProps) {
  const { services, isLoading, createService, updateService, deleteService } =
    useMedicalServices(profileId);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<MedicalService | null>(
    null,
  );

  // Form para crear nuevo servicio
  const createForm = useForm<MedicalServiceFormValues>({
    resolver: zodResolver(medicalServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 30,
      price: "",
      category: "",
      requirements: "",
      isActive: true,
      imageAssetId: "",
    },
  });

  // Form para editar servicio existente
  const editForm = useForm<MedicalServiceFormValues>({
    resolver: zodResolver(medicalServiceSchema),
    defaultValues: {
      name: "",
      description: "",
      duration: 30,
      price: "",
      category: "",
      requirements: "",
      isActive: true,
      imageAssetId: "",
    },
  });

  const openEditModal = (service: MedicalService) => {
    setEditingService(service);
    editForm.reset({
      name: service.name,
      description: service.description || "",
      duration: service.duration,
      price: service.price || "",
      category: service.category || "",
      requirements: service.requirements || "",
      isActive: service.isActive,
      imageAssetId: service.imageAssetId || "",
    });
    setIsEditModalOpen(true);
  };

  const handleCreate = async (data: MedicalServiceFormValues) => {
    await createService.mutateAsync({
      profileId,
      ...data,
    });

    createForm.reset();
    setIsCreateModalOpen(false);
  };

  const handleEdit = async (data: MedicalServiceFormValues) => {
    if (!editingService) return;

    await updateService.mutateAsync({
      id: editingService.id,
      data,
    });

    editForm.reset();
    setEditingService(null);
    setIsEditModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (
      window.confirm(
        "¿Estás seguro de que deseas eliminar este servicio médico?",
      )
    ) {
      deleteService.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const hasServices = services && services.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Servicios Médicos</h2>
          <p className="text-muted-foreground">
            Gestiona los servicios que ofreces a tus pacientes
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Servicio
        </Button>
      </div>

      {hasServices ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={() => openEditModal(service)}
              onDelete={() => handleDelete(service.id)}
            />
          ))}
        </div>
      ) : (
        <ServiceEmptyState onCreate={() => setIsCreateModalOpen(true)} />
      )}

      {/* Modal de Creación */}
      <ResponsiveModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        title="Nuevo Servicio Médico"
        description="Completa los datos para crear un nuevo servicio"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                createForm.reset();
                setIsCreateModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={createForm.handleSubmit(handleCreate)}
              disabled={createService.isPending}
            >
              {createService.isPending ? "Creando..." : "Crear Servicio"}
            </Button>
          </>
        }
      >
        <Form {...createForm}>
          <ServiceForm form={createForm} profileId={profileId} />
        </Form>
      </ResponsiveModal>

      {/* Modal de Edición */}
      <ResponsiveModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        title="Editar Servicio"
        description="Modifica los datos del servicio seleccionado"
        footer={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                editForm.reset();
                setEditingService(null);
                setIsEditModalOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={editForm.handleSubmit(handleEdit)}
              disabled={updateService.isPending}
            >
              {updateService.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </>
        }
      >
        <Form {...editForm}>
          <ServiceForm form={editForm} profileId={profileId} />
        </Form>
      </ResponsiveModal>
    </div>
  );
}
