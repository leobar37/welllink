import { Pencil, Trash2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { FAQItem } from "@/types/faq";

interface FAQListProps {
  faqs: FAQItem[];
  onEdit: (faq: FAQItem) => void;
  onDelete: (id: string) => void;
  onToggleEnabled: (id: string, enabled: boolean) => void;
  disabled?: boolean;
}

export function FAQList({
  faqs,
  onEdit,
  onDelete,
  onToggleEnabled,
  disabled = false,
}: FAQListProps) {
  if (faqs.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No tienes preguntas configuradas
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Agrega tu primera pregunta frecuente para empezar
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <Card
          key={faq.id}
          className={`transition-opacity ${!faq.enabled ? "opacity-60" : ""}`}
        >
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </span>
                  <h4 className="font-medium truncate">{faq.question}</h4>
                  {!faq.enabled && (
                    <Badge variant="secondary" className="text-xs">
                      Inactiva
                    </Badge>
                  )}
                </div>

                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {faq.answer}
                </p>

                <div className="flex flex-wrap gap-1">
                  {faq.keywords.map((keyword, kidx) => (
                    <Badge
                      key={`${faq.id}-${keyword}-${kidx}`}
                      variant="outline"
                      className="text-xs"
                    >
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={faq.enabled}
                    onCheckedChange={(checked) =>
                      onToggleEnabled(faq.id, checked)
                    }
                    disabled={disabled}
                    aria-label={
                      faq.enabled ? "Desactivar pregunta" : "Activar pregunta"
                    }
                  />
                  {faq.enabled ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(faq)}
                  disabled={disabled}
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      className="text-destructive hover:text-destructive"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        ¿Eliminar esta pregunta?
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer. La pregunta &quot;
                        {faq.question}&quot; será eliminada permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(faq.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
