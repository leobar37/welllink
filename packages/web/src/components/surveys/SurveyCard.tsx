import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Calendar, Mail, Phone } from "lucide-react";
import type { HealthSurvey } from "@/hooks/use-health-surveys";

interface SurveyCardProps {
  survey: HealthSurvey;
  onConvert?: (id: string) => void;
  isConverting?: boolean;
}

export function SurveyCard({ survey, onConvert, isConverting }: SurveyCardProps) {
  return (
    <Card className="hover:bg-muted/5 transition-colors">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">{survey.visitorName}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(survey.createdAt).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Encuesta
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {survey.visitorPhone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{survey.visitorPhone}</span>
              </div>
            )}
            {survey.visitorEmail && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span className="truncate">{survey.visitorEmail}</span>
              </div>
            )}
          </div>

          {survey.referredBy && (
            <div className="text-sm">
              <span className="font-medium text-muted-foreground">Referido por: </span>
              <span className="text-muted-foreground">{survey.referredBy}</span>
            </div>
          )}

          {onConvert && (
            <Button
              onClick={() => onConvert(survey.id)}
              disabled={isConverting}
              className="w-full"
              size="sm"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {isConverting ? "Convirtiendo..." : "Convertir a Cliente"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
