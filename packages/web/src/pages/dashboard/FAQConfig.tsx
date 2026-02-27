import { useState } from "react";
import { Link } from "react-router";
import { Plus, Loader2, HelpCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "@/hooks/use-profile";
import { useFAQConfig } from "@/hooks/use-faq-config";
import { FAQList, FAQItemForm } from "@/components/faq";
import type { FAQItem } from "@/types/faq";

export function FAQConfig() {
  const { profile, isLoading: isProfileLoading } = useProfile();
  const profileId = profile?.id;

  const {
    faqs,
    isLoading: isFAQsLoading,
    updateFAQ,
    isUpdating,
  } = useFAQConfig(profileId);

  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const isLoading = isProfileLoading || isFAQsLoading;

  const handleSave = (faq: FAQItem) => {
    const updatedFaqs = editingFaq
      ? faqs.map((f) => (f.id === faq.id ? faq : f))
      : [...faqs, faq];

    updateFAQ(updatedFaqs, {
      onSuccess: () => {
        setEditingFaq(null);
        setIsCreating(false);
      },
    });
  };

  const handleDelete = (id: string) => {
    const updatedFaqs = faqs.filter((f) => f.id !== id);
    updateFAQ(updatedFaqs);
  };

  const handleToggleEnabled = (id: string, enabled: boolean) => {
    const updatedFaqs = faqs.map((f) => (f.id === id ? { ...f, enabled } : f));
    updateFAQ(updatedFaqs);
  };

  const handleLoadDefaults = () => {
    const defaultFaqs: FAQItem[] = [
      {
        id: crypto.randomUUID(),
        question: "¿Cuáles son los horarios de atención?",
        answer:
          "Nuestros horarios de atención son de Lunes a Viernes de 9:00 a 18:00 y Sábados de 9:00 a 13:00. Puedes agendar citas en cualquier momento a través de este chat.",
        keywords: ["horario", "horarios", "atienden", "abren", "cerrado"],
        enabled: true,
      },
      {
        id: crypto.randomUUID(),
        question: "¿Cuánto cuesta una consulta?",
        answer:
          "Los precios varían según el tipo de servicio. Para conocer el precio exacto de la consulta o procedimiento que necesitas, puedo mostrarte nuestra lista de servicios. ¿Te gustaría ver los precios?",
        keywords: ["precio", "costo", "cuánto", "cuanto cuesta", "tarifa"],
        enabled: true,
      },
      {
        id: crypto.randomUUID(),
        question: "¿Dónde están ubicados?",
        answer:
          "Para conocer nuestra ubicación exacta y cómo llegar, puedo enviarte la dirección. También puedes encontrar un enlace a Google Maps en nuestro perfil público.",
        keywords: ["ubicación", "dirección", "donde", "cómo llegar", "maps"],
        enabled: true,
      },
      {
        id: crypto.randomUUID(),
        question: "¿Cómo cancelo o reprogramo mi cita?",
        answer:
          "Para cancelar o reprogramar una cita, responde a este chat con tu nombre y la fecha de la cita. Te ayudaremos a reprogramar o cancelar sin costo adicional (con al menos 24 horas de anticipación).",
        keywords: ["cancelar", "reagendar", "cambiar", "reprogramar"],
        enabled: true,
      },
    ];

    updateFAQ([...faqs, ...defaultFaqs]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Preguntas Frecuentes
          </h1>
          <p className="text-muted-foreground">
            Configura respuestas automáticas para tu chatbot
          </p>
        </div>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">No se encontró perfil</h2>
          <p className="text-muted-foreground mb-4">
            Completa el proceso de configuración para personalizar tu chatbot.
          </p>
          <Button asChild>
            <Link to="/onboarding">Ir a Configuración</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Preguntas Frecuentes
          </h1>
          <p className="text-muted-foreground">
            Configura respuestas automáticas para las consultas más comunes
          </p>
        </div>
        <div className="flex gap-2">
          {faqs.length === 0 && (
            <Button
              variant="outline"
              onClick={handleLoadDefaults}
              disabled={isUpdating}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Usar sugeridas
            </Button>
          )}
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isCreating || !!editingFaq || isUpdating}
          >
            <Plus className="mr-2 h-4 w-4" />
            Agregar pregunta
          </Button>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <HelpCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{faqs.length}</p>
                <p className="text-sm text-muted-foreground">
                  {faqs.length === 1
                    ? "pregunta configurada"
                    : "preguntas configuradas"}
                </p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-2xl font-bold">
                  {faqs.filter((f) => f.enabled).length}
                </p>
                <p className="text-sm text-muted-foreground">activas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {(isCreating || editingFaq) && (
          <FAQItemForm
            faq={editingFaq || undefined}
            onSave={handleSave}
            onCancel={() => {
              setIsCreating(false);
              setEditingFaq(null);
            }}
            isSaving={isUpdating}
          />
        )}

        <Card>
          <CardHeader>
            <CardTitle>Tus preguntas</CardTitle>
            <CardDescription>
              Gestiona las preguntas y respuestas que tu chatbot utilizará
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FAQList
              faqs={faqs}
              onEdit={setEditingFaq}
              onDelete={handleDelete}
              onToggleEnabled={handleToggleEnabled}
              disabled={isUpdating}
            />
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">💡 Consejos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • Usa palabras clave específicas para mejorar el reconocimiento
            </p>
            <p>• Mantén las respuestas claras y concisas</p>
            <p>• Desactiva preguntas temporales sin eliminarlas</p>
            <p>
              • El chatbot usará estas respuestas cuando detecte las palabras
              clave
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
