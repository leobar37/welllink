import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function EditProfile() {
  const { profile, isLoading, updateProfile, uploadAvatar } = useProfile();
  const { data: avatarUrl } = useAssetUrl(profile?.avatarId);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    mode: "onChange",
  });

  const { isDirty, isValid } = form.formState;

  useEffect(() => {
    if (profile) {
      form.reset({
        displayName: profile.displayName,
        username: profile.username,
        title: profile.title || "",
        bio: profile.bio || "",
        whatsappNumber: profile.whatsappNumber || "",
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

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Avatar</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="h-32 w-32">
              <AvatarImage src={avatarUrl || ""} />
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
            <div className="w-full">
              <label htmlFor="avatar-upload" className="cursor-pointer w-full">
                <div className="flex items-center justify-center w-full py-2 px-4 border rounded-md hover:bg-muted transition-colors text-sm font-medium">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Perfil</CardTitle>
            <CardDescription>
              Actualiza la información de tu perfil visible para los visitantes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
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
                        Esta es tu URL única: {window.location.origin}/
                        {field.value}
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
