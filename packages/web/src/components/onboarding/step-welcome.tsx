import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bienvenido a Wellness Link</CardTitle>
        <CardDescription>
          Configuremos tu tarjeta digital profesional en solo unos minutos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-muted-foreground">
          Te guiaremos para crear tu perfil, agregar tu foto y conectar tus redes sociales.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => onNext()} className="w-full" size="lg">
          Comenzar
        </Button>
      </CardFooter>
    </Card>
  )
}
