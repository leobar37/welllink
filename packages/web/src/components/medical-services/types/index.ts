import { z } from "zod";

// Esquema de validación para el formulario de servicios médicos
export const medicalServiceSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
  duration: z.number().min(1, "La duración es requerida"),
  price: z.string().optional(),
  category: z.string().optional(),
  requirements: z.string().optional(),
  isActive: z.boolean(),
  imageAssetId: z.string().optional(),
});

export type MedicalServiceFormValues = z.infer<typeof medicalServiceSchema>;

// Tipo para el componente ServiceCard
export interface ServiceCardProps {
  service: {
    id: string;
    name: string;
    description?: string | null;
    duration: number;
    price?: string | null;
    category?: string | null;
    requirements?: string | null;
    isActive: boolean;
    imageAssetId?: string | null;
  };
  onEdit: () => void;
  onDelete: () => void;
}

// Tipo para el formulario de servicio
export interface ServiceFormProps {
  form: ReturnType<
    typeof import("react-hook-form").useForm<MedicalServiceFormValues>
  >;
  profileId: string;
  isPending?: boolean;
  mode?: "create" | "edit";
}

// Tipo para el estado vacío
export interface ServiceEmptyStateProps {
  onCreate: () => void;
}
