import { Leaf } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface StepIntroProps {
  advisorName: string
  advisorAvatar?: string | null
}

export function StepIntro({ advisorName, advisorAvatar }: StepIntroProps) {
  const initials = advisorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md text-center border-0 shadow-none bg-transparent">
        <CardHeader className="space-y-6 pb-4">
          {/* Wellness Icon */}
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Leaf className="h-10 w-10 text-primary" />
          </div>

          <div className="space-y-2">
            <CardTitle className="text-2xl sm:text-3xl font-bold">
              Conoce tu bienestar
            </CardTitle>
            <CardDescription className="text-base">
              Responde estas preguntas para que pueda ayudarte mejor.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Advisor info */}
          <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12 border-2 border-primary/20">
              {advisorAvatar && <AvatarImage src={advisorAvatar} alt={advisorName} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-left">
              <p className="text-sm text-muted-foreground">Tu asesor</p>
              <p className="font-semibold">{advisorName}</p>
            </div>
          </div>

          {/* Info points */}
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <span className="text-primary">✓</span>
              <span className="text-sm text-muted-foreground">
                Solo tomará unos minutos
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary">✓</span>
              <span className="text-sm text-muted-foreground">
                Tus respuestas son confidenciales
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-primary">✓</span>
              <span className="text-sm text-muted-foreground">
                Recibirás orientación personalizada
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
