import { useState, useEffect } from "react";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { KeywordInput } from "./keyword-input";
import type { FAQItem } from "@/types/faq";

const faqItemSchema = z.object({
  question: z
    .string()
    .min(5, "La pregunta debe tener al menos 5 caracteres")
    .max(200, "La pregunta no puede exceder 200 caracteres"),
  answer: z
    .string()
    .min(10, "La respuesta debe tener al menos 10 caracteres")
    .max(1000, "La respuesta no puede exceder 1000 caracteres"),
  keywords: z
    .array(z.string().min(2))
    .min(1, "Agrega al menos una palabra clave"),
  enabled: z.boolean(),
});

interface FAQItemFormProps {
  faq?: FAQItem;
  onSave: (faq: FAQItem) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function FAQItemForm({
  faq,
  onSave,
  onCancel,
  isSaving = false,
}: FAQItemFormProps) {
  const isEditing = !!faq;

  const [formData, setFormData] = useState<{
    question: string;
    answer: string;
    keywords: string[];
    enabled: boolean;
  }>({
    question: "",
    answer: "",
    keywords: [],
    enabled: true,
  });

  const [errors, setErrors] = useState<{
    question?: string;
    answer?: string;
    keywords?: string;
  }>({});

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        keywords: faq.keywords,
        enabled: faq.enabled,
      });
    }
  }, [faq]);

  const validate = (): boolean => {
    const result = faqItemSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        newErrors[path] = issue.message;
      });
      setErrors(newErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSave = () => {
    if (!validate()) return;

    const faqItem: FAQItem = {
      id: faq?.id || crypto.randomUUID(),
      question: formData.question.trim(),
      answer: formData.answer.trim(),
      keywords: formData.keywords,
      enabled: formData.enabled,
    };

    onSave(faqItem);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {isEditing ? "Editar Pregunta" : "Nueva Pregunta"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question">
            Pregunta <span className="text-destructive">*</span>
          </Label>
          <Input
            id="question"
            value={formData.question}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, question: e.target.value }))
            }
            placeholder="Ej: ¿Cuáles son los horarios de atención?"
            disabled={isSaving}
          />
          {errors.question && (
            <p className="text-sm text-destructive">{errors.question}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer">
            Respuesta <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="answer"
            value={formData.answer}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, answer: e.target.value }))
            }
            placeholder="Escribe la respuesta completa..."
            rows={4}
            disabled={isSaving}
          />
          {errors.answer && (
            <p className="text-sm text-destructive">{errors.answer}</p>
          )}
          <p className="text-xs text-muted-foreground">
            {formData.answer.length} / 1000 caracteres
          </p>
        </div>

        <div className="space-y-2">
          <Label>
            Palabras clave <span className="text-destructive">*</span>
          </Label>
          <KeywordInput
            keywords={formData.keywords}
            onChange={(keywords) =>
              setFormData((prev) => ({ ...prev, keywords }))
            }
            disabled={isSaving}
            placeholder="Escribe palabras clave relacionadas"
          />
          {errors.keywords && (
            <p className="text-sm text-destructive">{errors.keywords}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="enabled"
              checked={formData.enabled}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, enabled: checked }))
              }
              disabled={isSaving}
            />
            <Label htmlFor="enabled" className="cursor-pointer">
              {formData.enabled ? "Activa" : "Inactiva"}
            </Label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Agregar"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
