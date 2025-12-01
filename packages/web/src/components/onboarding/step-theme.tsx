import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Paintbrush } from "lucide-react"

export function StepTheme({ onNext }: { onNext: (data: { theme: string }) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personaliza tu Estilo</CardTitle>
        <CardDescription>
          Esta función estará disponible pronto. Por ahora, usarás nuestro tema premium por defecto.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center py-8">
        <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Paintbrush className="h-10 w-10 text-primary" />
        </div>
        <p className="text-center text-muted-foreground">
            Estamos preparando una colección de hermosos temas para ti.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onNext({ theme: "default" })} className="w-full">
          Continuar con tema por defecto
        </Button>
      </CardFooter>
    </Card>
  )
}
