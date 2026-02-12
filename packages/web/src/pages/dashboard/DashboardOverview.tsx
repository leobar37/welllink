import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Eye,
  MousePointerClick,
  FileText,
  ExternalLink,
  Share2,
  PenSquare,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useProfile, useProfileStats } from "@/hooks/use-profile";
import { RecentActivity } from "@/components/dashboard/RecentActivity";

export function DashboardOverview() {
  const { data: session } = authClient.useSession();
  const { profile, isLoading: loadingProfile } = useProfile();
  const { data: stats, isLoading: loadingStats } = useProfileStats(profile?.id);

  if (loadingProfile || loadingStats) {
    return <DashboardSkeleton />;
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">No se encontró perfil</h2>
        <p className="text-muted-foreground mb-4">
          Completa el proceso de configuración para ver tu panel.
        </p>
        <Button asChild>
          <Link to="/onboarding">Ir a Configuración</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
          Hola, {profile.displayName || session?.user.name} 👋
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a
              href={`/${profile.username}`}
              target="_blank"
              rel="noopener noreferrer"
            >
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
        <div className="bg-muted/40 rounded-2xl p-5 transition-colors hover:bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Visualizaciones Totales
            </span>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="text-3xl font-semibold tracking-tight">{stats?.views || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            +0% desde el mes pasado
          </p>
        </div>

        <div className="bg-muted/40 rounded-2xl p-5 transition-colors hover:bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Clics en Redes
            </span>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <MousePointerClick className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div className="text-3xl font-semibold tracking-tight">{stats?.socialClicks || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            +0% desde el mes pasado
          </p>
        </div>

        <div className="bg-muted/40 rounded-2xl p-5 transition-colors hover:bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Respuestas de Encuestas
            </span>
            <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
              <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-semibold tracking-tight">0</div>
          <p className="text-xs text-muted-foreground mt-1">Próximamente</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <h3 className="text-lg font-medium mb-4">Actividad Reciente</h3>
          <div className="bg-muted/40 rounded-2xl p-5">
            <RecentActivity profileId={profile.id} />
          </div>
        </div>

        <div className="col-span-3">
          <h3 className="text-lg font-medium mb-4">Acciones Rápidas</h3>
          <div className="bg-muted/40 rounded-2xl p-5">
            <div className="grid gap-2">
              <Button variant="ghost" className="justify-start hover:bg-background" asChild>
                <Link to="/dashboard/profile">
                  <PenSquare className="mr-2 h-4 w-4" />
                  Editar Perfil
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start hover:bg-background" asChild>
                <Link to="/dashboard/features">
                  <FileText className="mr-2 h-4 w-4" />
                  Gestionar Funciones
                </Link>
              </Button>
              <Button variant="ghost" className="justify-start hover:bg-background" asChild>
                <Link to="/dashboard/settings">
                  <Share2 className="mr-2 h-4 w-4" />
                  Configuración de Cuenta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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
  );
}
