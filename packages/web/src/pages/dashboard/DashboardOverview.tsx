import { Link } from "react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, MousePointerClick, FileText, ExternalLink, Share2, PenSquare } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { useProfile, useProfileStats } from "@/hooks/use-profile"

export function DashboardOverview() {
  const { data: session } = authClient.useSession()
  const { profile, isLoading: loadingProfile } = useProfile()
  const { data: stats, isLoading: loadingStats } = useProfileStats(profile?.id)

  if (loadingProfile || loadingStats) {
    return <DashboardSkeleton />
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">No se encontró perfil</h2>
        <p className="text-muted-foreground mb-4">Completa el proceso de configuración para ver tu panel.</p>
        <Button asChild>
            <Link to="/onboarding">Ir a Configuración</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
            Hola, {profile.displayName || session?.user.name} 👋
        </h1>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <a href={`/${profile.username}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Ver Público
                </a>
            </Button>
            <Button asChild>
                 <Link to="/dashboard/qr">
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir
                 </Link>
            </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visualizaciones Totales</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.views || 0}</div>
            <p className="text-xs text-muted-foreground">
              +0% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clics en Redes</CardTitle>
            <MousePointerClick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.socialClicks || 0}</div>
            <p className="text-xs text-muted-foreground">
              +0% desde el mes pasado
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respuestas de Encuestas</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              Próximamente
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
         {/* Placeholder for Chart or Activity Feed */}
         <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center h-[200px] text-muted-foreground bg-muted/20 rounded-md border border-dashed">
                    No hay actividad reciente que mostrar
                </div>
            </CardContent>
         </Card>

         <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
                <Button variant="outline" className="justify-start" asChild>
                    <Link to="/dashboard/profile">
                        <PenSquare className="mr-2 h-4 w-4" />
                        Editar Perfil
                    </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                    <Link to="/dashboard/features">
                        <FileText className="mr-2 h-4 w-4" />
                        Gestionar Funciones
                    </Link>
                </Button>
                <Button variant="outline" className="justify-start" asChild>
                    <Link to="/dashboard/settings">
                        <Share2 className="mr-2 h-4 w-4" />
                        Configuración de Cuenta
                    </Link>
                </Button>
            </CardContent>
         </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between">
                <Skeleton className="h-10 w-64" />
                <div className="flex gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
            </div>
        </div>
    )
}
