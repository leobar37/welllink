import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Loader2 } from "lucide-react"
import { useProfile } from "@/hooks/use-profile"
import { useIsMobile } from "@/hooks/use-mobile"

type SurveyResponse = {
  id: string
  createdAt: string
  visitorName?: string | null
  visitorWhatsapp?: string | null
  responses?: {
    goal?: string | null
  } | null
  status?: string | null
}

export function SurveyResults() {
  const { profile } = useProfile()
  const isMobile = useIsMobile()

  const { data: surveys = [], isLoading } = useQuery<SurveyResponse[]>({
    queryKey: ["surveys", profile?.id],
    queryFn: async () => {
        if (!profile?.id) return []
        const { data, error } = await api.api["health-survey"].get({
            $query: { profileId: profile.id }
        })
        if (error) throw error
        return Array.isArray(data) ? (data as SurveyResponse[]) : []
    },
    enabled: !!profile?.id
  })

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Resultados de Encuestas</h1>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Respuestas Recientes</CardTitle>
            <CardDescription>
                Ver quién ha completado tu encuesta de salud.
            </CardDescription>
        </CardHeader>
        <CardContent>
            {isMobile ? (
                // Mobile view: Card-based layout
                <div className="space-y-3">
                    {surveys.length > 0 ? (
                        surveys.map((survey) => (
                            <Card key={survey.id} className="p-4 border-muted">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm text-muted-foreground">
                                                {format(new Date(survey.createdAt), "MMM d, yyyy")}
                                            </p>
                                            <h3 className="font-semibold text-base">
                                                {survey.visitorName || "Sin nombre"}
                                            </h3>
                                        </div>
                                        <Badge variant={survey.status === 'new' ? 'default' : 'outline'}>
                                            {survey.status || 'Nuevo'}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium">Objetivo:</span>
                                            <Badge variant="secondary" className="capitalize text-xs">
                                                {survey.responses?.goal?.replace("_", " ") || "Desconocido"}
                                            </Badge>
                                        </div>

                                        {survey.visitorWhatsapp && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">WhatsApp:</span>
                                                <a
                                                    href={`https://wa.me/${survey.visitorWhatsapp.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-sm text-primary hover:underline"
                                                >
                                                    {survey.visitorWhatsapp}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                            Aún no hay respuestas de encuestas.
                        </div>
                    )}
                </div>
            ) : (
                // Desktop view: Table layout
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Objetivo</TableHead>
                                <TableHead>WhatsApp</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {surveys.length > 0 ? (
                                surveys.map((survey) => (
                                    <TableRow key={survey.id}>
                                        <TableCell>
                                            {format(new Date(survey.createdAt), "MMM d, yyyy")}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {survey.visitorName}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="capitalize">
                                                {survey.responses?.goal?.replace("_", " ") || "Desconocido"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {survey.visitorWhatsapp ? (
                                                <a
                                                    href={`https://wa.me/${survey.visitorWhatsapp.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary hover:underline"
                                                >
                                                    {survey.visitorWhatsapp}
                                                </a>
                                            ) : (
                                                "-"
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={survey.status === 'new' ? 'default' : 'outline'}>
                                                {survey.status || 'Nuevo'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        Aún no hay respuestas de encuestas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  )
}
