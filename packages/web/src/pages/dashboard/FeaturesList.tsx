import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { FileText, Settings2 } from "lucide-react"
import { toast } from "sonner"

export function FeaturesList() {
  // In a real app, this would be fetched from the API
  // For MVP, Health Survey is always enabled by default
  const [features, setFeatures] = useState([
    {
        id: "health-survey",
        name: "Encuesta de Salud",
        description: "Prueba de transformación de 7 días que envía resultados por WhatsApp.",
        enabled: true,
        icon: FileText
    },
    {
        id: "appointments",
        name: "Citas",
        description: "Permite a los clientes reservar consultas directamente.",
        enabled: false,
        comingSoon: true,
        icon: Settings2
    }
  ])

  const toggleFeature = (id: string) => {
    setFeatures(features.map(f => {
        if (f.id === id) {
            if (f.comingSoon) {
                toast.info("¡Esta función próximamente!")
                return f
            }
            // Here we would call API to update feature status
            toast.success(`Función ${!f.enabled ? "activada" : "desactivada"}`)
            return { ...f, enabled: !f.enabled }
        }
        return f
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Funciones</h1>
      </div>

      <div className="grid gap-4">
        {features.map((feature) => (
            <Card key={feature.id} className={feature.comingSoon ? "opacity-70" : ""}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <feature.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{feature.name}</CardTitle>
                            <CardDescription className="mt-1">{feature.description}</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Switch 
                            id={`feature-${feature.id}`}
                            checked={feature.enabled}
                            onCheckedChange={() => toggleFeature(feature.id)}
                            disabled={feature.comingSoon}
                        />
                        <Label htmlFor={`feature-${feature.id}`}>
                            {feature.comingSoon ? "Próximamente" : (feature.enabled ? "Activa" : "Inactiva")}
                        </Label>
                    </div>
                </CardHeader>
                {!feature.comingSoon && feature.enabled && (
                    <CardContent className="pt-4 border-t mt-4">
                        <div className="flex justify-end">
                            <Button variant="outline" size="sm" onClick={() => toast.info("Configuración próximamente")}>
                                <Settings2 className="mr-2 h-4 w-4" />
                                Configurar
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>
        ))}
      </div>
    </div>
  )
}
