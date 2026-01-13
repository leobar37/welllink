import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Loader2,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSocialLinks } from "@/hooks/use-social-links";

const socialLinkSchema = z
  .object({
    platform: z.enum(["whatsapp", "instagram", "tiktok", "facebook", "youtube"]),
    username: z.string().min(1, "El usuario es requerido"),
  })
  .superRefine((data, ctx) => {
    const { platform, username } = data;
    const trimmed = username.trim();

    switch (platform) {
      case "instagram":
        if (!/^[a-zA-Z0-9._]{1,30}$/.test(trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["username"],
            message:
              "Usuario de Instagram inválido. Debe tener 1-30 caracteres: letras, números, puntos y guiones bajos.",
          });
          return false;
        }
        break;

      case "tiktok":
        if (!/^[a-zA-Z0-9_]{1,24}$/.test(trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["username"],
            message:
              "Usuario de TikTok inválido. Debe tener 1-24 caracteres: letras, números y guiones bajos.",
          });
          return false;
        }
        break;

      case "facebook":
        if (!/^[a-zA-Z0-9.-]{5,50}$/.test(trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["username"],
            message:
              "Usuario de Facebook inválido. Debe tener 5-50 caracteres.",
          });
          return false;
        }
        break;

      case "youtube":
        if (!/^[a-zA-Z0-9_-]{3,30}$/.test(trimmed)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["username"],
            message:
              "Handle de YouTube inválido. Debe tener 3-30 caracteres: letras, números, guiones y guiones bajos.",
          });
          return false;
        }
        break;

      case "whatsapp":
        const digitsOnly = trimmed.replace(/\D/g, "");
        if (digitsOnly.length < 10 || digitsOnly.length > 15) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["username"],
            message:
              "Número de WhatsApp inválido. Ingrese solo dígitos (incluyendo código de país).",
          });
          return false;
        }
        break;
    }

    return true;
  });

type SocialLinkValues = z.infer<typeof socialLinkSchema>;

export function SocialLinks() {
  const { links, isLoading, createLink, deleteLink, reorderLinks } =
    useSocialLinks();
  const [adding, setAdding] = useState(false);

  const form = useForm<SocialLinkValues>({
    resolver: zodResolver(socialLinkSchema),
    defaultValues: {
      platform: "instagram",
      username: "",
    },
  });

  function onSubmit(data: SocialLinkValues) {
    createLink.mutate(data, {
      onSuccess: () => {
        setAdding(false);
        form.reset();
      },
    });
  }

  function handleMove(index: number, direction: "up" | "down") {
    if (!links) return;
    const newLinks = [...links];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newLinks.length) return;

    // Swap
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;

    // Optimistic update + API call
    reorderLinks.mutate(newLinks.map((l) => l.id));
  }

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin mx-auto" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Enlaces Sociales</h1>
        <Button onClick={() => setAdding(!adding)} disabled={adding}>
          <Plus className="mr-2 h-4 w-4" /> Agregar Enlace
        </Button>
      </div>

      {adding && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Nuevo Enlace</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="flex flex-col md:flex-row gap-4 items-end"
              >
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem className="w-full md:w-48">
                      <FormLabel>Plataforma</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar plataforma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="instagram">Instagram</SelectItem>
                          <SelectItem value="whatsapp">WhatsApp</SelectItem>
                          <SelectItem value="tiktok">TikTok</SelectItem>
                          <SelectItem value="facebook">Facebook</SelectItem>
                          <SelectItem value="youtube">YouTube</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="flex-1 w-full">
                      <FormLabel>
                        {form.watch("platform") === "whatsapp"
                          ? "Número de WhatsApp"
                          : form.watch("platform") === "youtube"
                          ? "Handle de YouTube"
                          : "Usuario"}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={
                            form.watch("platform") === "whatsapp"
                              ? "1234567890"
                              : form.watch("platform") === "youtube"
                              ? "@usuario"
                              : "usuario"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={createLink.isPending}>
                    {createLink.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Guardar
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setAdding(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {links && links.length > 0
          ? links.map((link, index) => (
              <Card
                key={link.id}
                className="p-4 hover:bg-muted/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Platform badge */}
                  <div className="shrink-0 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-md capitalize font-medium text-sm">
                    {link.platform}
                  </div>

                  {/* URL - takes remaining space */}
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 min-w-0 text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors flex items-center gap-1"
                  >
                    <span className="truncate">@{link.username}</span>
                    <ExternalLink className="shrink-0 h-3 w-3" />
                  </a>

                  {/* Actions - always visible, shrink-0 */}
                  <div className="shrink-0 flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === 0}
                      onClick={() => handleMove(index, "up")}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      disabled={index === links.length - 1}
                      onClick={() => handleMove(index, "down")}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => deleteLink.mutate(link.id)}
                    >
                      {deleteLink.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          : !adding && (
              <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                No hay enlaces sociales agregados aún. Haz clic en "Agregar Enlace" para empezar.
              </div>
            )}
      </div>
    </div>
  );
}
