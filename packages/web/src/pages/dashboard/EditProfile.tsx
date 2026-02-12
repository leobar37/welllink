import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Upload, Building2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/use-profile";
import { useAssetUrl } from "@/hooks/use-asset-url";

const profileFormSchema = z.object({
  displayName: z.string().min(2, {
    message: "El nombre para mostrar debe tener al menos 2 caracteres.",
  }),
  username: z
    .string()
    .min(3)
    .regex(/^[a-z0-9_-]+$/, {
      message:
        "El nombre de usuario solo puede contener letras minúsculas, números, guiones bajos y guiones.",
    }),
  title: z.string().max(100).optional(),
  bio: z.string().max(160).optional(),
  whatsappNumber: z.string().optional(),
  isOrganization: z.boolean().default(false),
  clinicName: z.string().max(100).optional(),
  clinicAddress: z.string().optional(),
  clinicPhone: z.string().max(20).optional(),
  clinicEmail: z.string().email().optional().or(z.literal("")),
  clinicWebsite: z.string().url().optional().or(z.literal("")),
  clinicRuc: z.string().max(20).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfile() {
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  const { data: avatarUrl } = useAssetUrl(profile?.avatarId);
  const [showClinicFields, setShowClinicFields] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
  });

  const { isDirty, isValid } = form.formState;

  useEffect(() => {
    if (profile) {
      const isOrg = profile.isOrganization ?? false;
      setShowClinicFields(isOrg);
      form.reset({
        displayName: profile.displayName,
        username: profile.username,
        title: profile.title || "",
        bio: profile.bio || "",
        whatsappNumber: profile.whatsappNumber || "",
        isOrganization: isOrg,
        clinicName: profile.clinicName || "",
        clinicAddress: profile.clinicAddress || "",
        clinicPhone: profile.clinicPhone || "",
        clinicEmail: profile.clinicEmail || "",
        clinicWebsite: profile.clinicWebsite || "",
        clinicRuc: profile.clinicRuc || "",
      });
    }
  }, [profile, form]);

  function onSubmit(data: ProfileFormValues) {
    if (!profile) return;
    updateProfile.mutate({ id: profile.id, data });
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Editar Perfil</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Info Section */}
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <div className="bg-muted/40 rounded-2xl p-6 flex flex-col items-center gap-4">
              <h3 className="text-lg font-medium self-start">Avatar</h3>
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarUrl || ""} />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="cursor-pointer w-full">
                <div className="flex items-center justify-center w-full py-2.5 px-4 bg-background rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                  <Upload className="w-4 h-4 mr-2" />
                  {uploadAvatar.isPending ? "Subiendo..." : "Cambiar Foto"}
                </div>
                <input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={uploadAvatar.isPending}
                />
              </label>
            </div>

            <div className="bg-muted/40 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-lg font-medium">Información del Perfil</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Actualiza la información de tu perfil visible para los visitantes.
                </p>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre para Mostrar</FormLabel>
                      <FormControl>
                        <Input placeholder="Dra. Juana Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre de Usuario</FormLabel>
                      <FormControl>
                        <Input placeholder="juana-perez" {...field} />
                      </FormControl>
                      <FormDescription>
                        Esta es tu URL única:{" "}
                        {typeof window !== "undefined"
                          ? window.location.origin
                          : ""}
                        /{field.value}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título Profesional</FormLabel>
                      <FormControl>
                        <Input placeholder="Nutriólogo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Biografía</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Cuéntanos sobre ti"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de WhatsApp</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormDescription>
                        Se usa para recibir resultados de encuestas (privado).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Clinic/Organization Section */}
          <div className="grid gap-6 md:grid-cols-[280px_1fr]">
            <div className="bg-muted/40 rounded-2xl p-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Clínica</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Información de tu consultorio o clínica
              </p>
            </div>

            <div className="bg-muted/40 rounded-2xl p-6 space-y-5">
              <div>
                <h3 className="text-lg font-medium">Información de la Clínica</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Completa esta sección si eres una clínica u organización.
                </p>
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="isOrganization"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-xl bg-background p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          ¿Eres una clínica u organización?
                        </FormLabel>
                        <FormDescription>
                          Activa esta opción si deseas mostrar información de tu
                          consultorio
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={!!field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setShowClinicFields(checked);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {showClinicFields && (
                  <>
                    <FormField
                      control={form.control}
                      name="clinicName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Clínica</FormLabel>
                          <FormControl>
                            <Input placeholder="Clínica Bienestar" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clinicAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Dirección</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Calle principal #123, Ciudad"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clinicPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono Fijo</FormLabel>
                          <FormControl>
                            <Input placeholder="+51 1 2345678" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clinicEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email de Contacto</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="contacto@clinica.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clinicWebsite"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="https://www.clinica.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="clinicRuc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RUC</FormLabel>
                          <FormControl>
                            <Input placeholder="12345678901" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Single Save Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!isDirty || !isValid || updateProfile.isPending}
            >
              {updateProfile.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
