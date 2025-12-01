import { useNavigate } from "react-router"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2 } from "lucide-react"

export function StepCompletion() {
  const navigate = useNavigate()

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
        </div>
        <CardTitle className="text-2xl">¡Todo Listo!</CardTitle>
        <CardDescription>
          Tu perfil de Wellness Link está listo para compartir.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center space-y-2">
        <p>
            Ahora puedes acceder a tu panel para administrar tu tarjeta, ver estadísticas y explorar más funciones.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={() => navigate("/dashboard")} className="w-full" size="lg">
          Ir al Panel
        </Button>
      </CardFooter>
    </Card>
  )
}
