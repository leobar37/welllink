import { useState } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Edit2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useWizard } from "../wizard/WizardContext";
import { SurveyNavigation } from "../wizard/SurveyNavigation";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  TRAINING_OPTIONS,
  NUTRITION_OPTIONS,
} from "@/lib/survey/constants";
import {
  generateWhatsAppMessage,
  generateWhatsAppLink,
} from "@/lib/survey/whatsapp";
import { api } from "@/lib/api";
import { toast } from "sonner";
import type { HealthSurveyFormData } from "@/lib/survey/schema";

interface StepSummaryProps {
  profileId: string;
  advisorWhatsapp: string;
}

export function StepSummary({ profileId, advisorWhatsapp }: StepSummaryProps) {
  const { state, goToStep, setSubmitting, setSubmitted, setError } =
    useWizard();
  const [openSections, setOpenSections] = useState<string[]>(["conditions"]);

  const data = state.data as HealthSurveyFormData;

  // Count total conditions
  const totalConditions = CATEGORY_ORDER.reduce(
    (sum, cat) => sum + (data.conditions?.[cat]?.length || 0),
    0,
  );

  // Toggle section
  const toggleSection = (section: string) => {
    setOpenSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  // Format training/nutrition values
  const formatTraining = (value: string) =>
    TRAINING_OPTIONS.find((o) => o.value === value)?.label || value;
  const formatNutrition = (value: string) =>
    NUTRITION_OPTIONS.find((o) => o.value === value)?.label || value;

  // Handle submission
  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);

    try {
      // Submit to API
      const { error } = await api.api["health-survey"].public.post({
        profileId,
        visitorName: data.personalData.visitorName,
        visitorPhone: data.personalData.visitorPhone,
        visitorEmail: data.personalData.visitorEmail,
        visitorWhatsapp: data.personalData.visitorWhatsapp,
        referredBy: data.personalData.referredBy,
        responses: {
          measurements: data.measurements,
          conditions: data.conditions,
          habits: data.habits,
          metadata: data.metadata,
        },
      });

      if (error) throw error;

      // Mark as submitted
      setSubmitted();

      // Generate and open WhatsApp
      const message = generateWhatsAppMessage(data);
      const link = generateWhatsAppLink(advisorWhatsapp, message);

      toast.success("¡Tu evaluación se ha enviado correctamente!");

      // Small delay to show success before opening WhatsApp
      setTimeout(() => {
        window.open(link, "_blank");
      }, 500);
    } catch (err) {
      console.error("Failed to submit survey:", err);
      setError("Error al enviar la encuesta. Por favor intenta de nuevo.");
      toast.error("Error al enviar la encuesta");
    }
  };

  // If submitted, show success
  if (state.isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <Card className="w-full max-w-md text-center border-0 shadow-none">
          <CardHeader className="space-y-4">
            <div className="mx-auto bg-green-100 dark:bg-green-900/30 p-4 rounded-full w-fit">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-500" />
            </div>
            <CardTitle className="text-2xl">¡Listo!</CardTitle>
            <CardDescription className="text-base">
              Tu evaluación de salud ha sido enviada correctamente. El asesor la
              recibirá en su panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                const message = generateWhatsAppMessage(data);
                const link = generateWhatsAppLink(advisorWhatsapp, message);
                window.open(link, "_blank");
              }}
              className="w-full"
            >
              Saludar por WhatsApp
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)]">
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <Card className="max-w-lg mx-auto border-0 shadow-none">
          <CardHeader className="px-0 pb-4">
            <CardTitle className="text-xl">Tu evaluación está lista</CardTitle>
            <CardDescription>
              Revisa tu información antes de enviar.
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 space-y-4">
            {/* Error message */}
            {state.error && (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
                {state.error}
              </div>
            )}

            {/* Personal Data Section */}
            <SummarySection
              title="Datos Personales"
              isOpen={openSections.includes("personal")}
              onToggle={() => toggleSection("personal")}
              onEdit={() => goToStep(1)}
            >
              <div className="space-y-2 text-sm">
                <SummaryRow
                  label="Nombre"
                  value={data.personalData?.visitorName}
                />
                <SummaryRow
                  label="Teléfono"
                  value={data.personalData?.visitorPhone}
                />
                <SummaryRow
                  label="WhatsApp"
                  value={data.personalData?.visitorWhatsapp}
                />
                <SummaryRow
                  label="Email"
                  value={data.personalData?.visitorEmail}
                />
                <SummaryRow
                  label="Referido por"
                  value={data.personalData?.referredBy}
                />
              </div>
            </SummarySection>

            {/* Measurements Section */}
            <SummarySection
              title="Medidas"
              isOpen={openSections.includes("measurements")}
              onToggle={() => toggleSection("measurements")}
              onEdit={() => goToStep(2)}
            >
              <div className="space-y-2 text-sm">
                <SummaryRow
                  label="Peso"
                  value={`${data.measurements?.weight} kg`}
                />
                <SummaryRow
                  label="Estatura"
                  value={`${data.measurements?.height} cm`}
                />
                <SummaryRow
                  label="Edad"
                  value={`${data.measurements?.age} años`}
                />
              </div>
            </SummarySection>

            {/* Conditions Section */}
            <SummarySection
              title={`Condiciones de Salud (${totalConditions})`}
              isOpen={openSections.includes("conditions")}
              onToggle={() => toggleSection("conditions")}
              onEdit={() => goToStep(3)}
            >
              {totalConditions === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Ninguna condición reportada
                </p>
              ) : (
                <div className="space-y-3">
                  {CATEGORY_ORDER.map((category) => {
                    const conditions = data.conditions?.[category] || [];
                    if (conditions.length === 0) return null;

                    const meta = CATEGORY_META[category];
                    return (
                      <div key={category}>
                        <p className="text-sm font-medium mb-1">
                          {meta.icon} {meta.friendlyName}
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {conditions.map((c: string) => (
                            <Badge
                              key={c}
                              variant="secondary"
                              className="text-xs"
                            >
                              {c}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SummarySection>

            {/* Habits Section */}
            <SummarySection
              title="Hábitos"
              isOpen={openSections.includes("habits")}
              onToggle={() => toggleSection("habits")}
              onEdit={() => goToStep(11)}
            >
              <div className="space-y-2 text-sm">
                <SummaryRow
                  label="Agua diaria"
                  value={data.habits?.waterIntake}
                />
                <SummaryRow
                  label="Entrena"
                  value={formatTraining(data.habits?.training)}
                />
                <SummaryRow
                  label="Alimentación"
                  value={formatNutrition(data.habits?.nutrition)}
                />
                <SummaryRow
                  label="Historial familiar"
                  value={data.habits?.familyHistory}
                />
              </div>
            </SummarySection>
          </CardContent>
        </Card>
      </div>

      <SurveyNavigation onSubmit={handleSubmit} />
    </div>
  );
}

// Summary Section Component
interface SummarySectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  children: React.ReactNode;
}

function SummarySection({
  title,
  isOpen,
  onToggle,
  onEdit,
  children,
}: SummarySectionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <div className="border rounded-lg">
        <div className="flex items-center justify-between p-3">
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {title}
            </button>
          </CollapsibleTrigger>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Editar
          </Button>
        </div>
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-0">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

// Summary Row Component
interface SummaryRowProps {
  label: string;
  value?: string | null;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  if (!value) return null;
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
