import { useParams } from "react-router"
import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { SurveyWizard } from "@/components/survey"
import { ProfileThemeProvider } from "@/components/public-profile/theme-provider"
import { Loader2, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PublicSurveyRoute() {
  const { username } = useParams<{ username: string }>()

  // Fetch profile data using the public endpoint
  const {
    data: profileData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-profile", username],
    queryFn: async () => {
      if (!username) throw new Error("Username is required")

      const { data, error } = await api.api.public.profiles[username].get()
      if (error) throw error
      return data
    },
    enabled: !!username,
    retry: 1,
  })

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Error state
  if (error || !profileData?.profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit mb-2">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <CardTitle>Perfil no encontrado</CardTitle>
            <CardDescription>
              No pudimos encontrar el perfil que buscas. Verifica la URL e
              intenta de nuevo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Volver
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { profile } = profileData

  // Check if advisor has WhatsApp configured
  if (!profile.whatsappNumber) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto bg-yellow-500/10 p-3 rounded-full w-fit mb-2">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle>Encuesta no disponible</CardTitle>
            <CardDescription>
              El asesor aún no ha configurado su número de WhatsApp para recibir
              evaluaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Volver al perfil
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Construct avatar URL
  const avatarUrl = profile.avatarId
    ? `${import.meta.env.VITE_API_URL || "http://localhost:5300"}/api/assets/${profile.avatarId}/public`
    : null

  // Get themeId from profileData (returned by API)
  const themeId = profileData.themeId

  return (
    <ProfileThemeProvider themeId={themeId}>
      <SurveyWizard
        username={username!}
        profileId={profile.id}
        advisorName={profile.displayName}
        advisorAvatar={avatarUrl}
        advisorWhatsapp={profile.whatsappNumber}
      />
    </ProfileThemeProvider>
  )
}
