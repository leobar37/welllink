import { z } from "zod";

export const clientFormSchema = z.object({
  name: z.string().min(2, "Nombre debe tener al menos 2 caracteres"),
  phone: z.string().min(8, "Teléfono inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  label: z.enum(["consumidor", "prospecto", "afiliado"], {
    required_error: "Selecciona una etiqueta",
  }),
  notes: z.string().optional(),
});

export type ClientForm = z.infer<typeof clientFormSchema>;
