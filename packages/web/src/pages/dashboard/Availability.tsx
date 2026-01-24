import { useState } from "react";
import { Plus } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AvailabilityRuleForm,
  AvailabilityRulesList,
  AvailabilityPreview,
} from "@/components/availability";
import {
  useAvailabilityRules,
  useCreateAvailabilityRule,
  useUpdateAvailabilityRule,
  useDeleteAvailabilityRule,
  usePreviewSlotsMutation,
} from "@/hooks/use-availability-rules";
import type { AvailabilityRule } from "@/hooks/use-availability-rules";

export function AvailabilityPage() {
  const { profile, isLoading: isLoadingProfile } = useProfile();
  const { data: rules, isLoading: isLoadingRules } = useAvailabilityRules(
    profile?.id || "",
  );
  const createRule = useCreateAvailabilityRule();
  const updateRule = useUpdateAvailabilityRule();
  const deleteRule = useDeleteAvailabilityRule();
  const previewMutation = usePreviewSlotsMutation();

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AvailabilityRule | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);

  const handleCreate = (data: any) => {
    createRule.mutate(data, {
      onSuccess: () => {
        setIsSheetOpen(false);
      },
    });
  };

  const handleUpdate = (data: any) => {
    if (!editingRule) return;
    updateRule.mutate(
      { ruleId: editingRule.id, data },
      {
        onSuccess: () => {
          setEditingRule(null);
          setIsSheetOpen(false);
        },
      },
    );
  };

  const handleDelete = (ruleId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta regla?")) {
      deleteRule.mutate(ruleId);
    }
  };

  const handleEdit = (rule: AvailabilityRule) => {
    setEditingRule(rule);
    setIsSheetOpen(true);
  };

  const handlePreview = () => {
    if (!profile?.id) return;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    previewMutation.mutate(
      { profileId: profile.id, startDate, endDate },
      {
        onSuccess: (data) => {
          setPreviewData(data);
          setShowPreview(true);
        },
      },
    );
  };

  if (isLoadingProfile || isLoadingRules) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Disponibilidad</h1>
          <p className="text-muted-foreground">
            Configura tus horarios de atención
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handlePreview}>
            Previsualizar Slots
          </Button>
          <Button onClick={() => setIsSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Regla
          </Button>
        </div>
      </div>

      {/* Rules List */}
      <Card>
        <CardHeader>
          <CardTitle>Reglas de Disponibilidad</CardTitle>
          <CardDescription>
            Define los días y horarios en los que estás disponible para atender
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityRulesList
            rules={rules || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Previsualización de Slots</DialogTitle>
            <DialogDescription>
              Estos son los slots que se generarán para la próxima semana
            </DialogDescription>
          </DialogHeader>
          <AvailabilityPreview
            data={previewData || []}
            isLoading={previewMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Create/Edit Sheet */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          side="right"
          className="w-[500px] sm:max-w-[540px] p-0 flex flex-col h-full"
        >
          <div className="p-6 pb-2">
            <SheetHeader>
              <SheetTitle>
                {editingRule ? "Editar Regla" : "Nueva Regla de Disponibilidad"}
              </SheetTitle>
              <SheetDescription>
                Configura un día y horario de atención
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-0">
            <AvailabilityRuleForm
              profileId={profile?.id || ""}
              rule={editingRule || undefined}
              onSubmit={editingRule ? handleUpdate : handleCreate}
              isLoading={createRule.isPending || updateRule.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
