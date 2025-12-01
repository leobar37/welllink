import { useForm, useFieldArray } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Plus, Trash2 } from "lucide-react"

type SocialPlatform = "instagram" | "whatsapp" | "tiktok" | "facebook" | "youtube" | "website"

interface SocialLink {
  platform: SocialPlatform | string
  url: string
}

interface SocialFormValues {
  links: SocialLink[]
}

export function StepSocial({ onNext }: { onNext: (data: SocialFormValues) => void }) {
  const form = useForm<SocialFormValues>({
    defaultValues: {
      links: [
        { platform: "whatsapp", url: "" },
        { platform: "instagram", url: "" }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "links"
  })

  const onSubmit = (data: SocialFormValues) => {
    // Filter empty URLs
    const validLinks = data.links.filter(l => l.url && l.url.trim() !== "")
    onNext({ links: validLinks })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conecta tus Redes Sociales</CardTitle>
        <CardDescription>
          ¿Dónde pueden encontrarte las personas?
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2 items-end">
                <div className="w-1/3">
                    <Label className="text-xs">Plataforma</Label>
                    <Input
                        {...form.register(`links.${index}.platform`)}
                        placeholder="Plataforma"
                    />
                </div>
                <div className="flex-1">
                    <Label className="text-xs">URL / Número</Label>
                    <Input
                        {...form.register(`links.${index}.url`)}
                        placeholder="https://..."
                    />
                </div>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => remove(index)}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ platform: "", url: "" })}
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" /> Agregar enlace
          </Button>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="ghost" type="button" onClick={() => onNext({ links: [] })}>
            Omitir
          </Button>
          <Button type="submit">
            Continuar
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
