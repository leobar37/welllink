import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { Loader2 } from "lucide-react"

export function StepWelcome({ onNext, isLoading }: { onNext: () => void; isLoading?: boolean }) {
  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Bienvenido a <Logo size="lg" className="inline" /></CardTitle>
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
        <Button onClick={() => onNext()} className="w-full" size="lg" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Comenzar
        </Button>
      </CardFooter>
    </Card>
  )
}
