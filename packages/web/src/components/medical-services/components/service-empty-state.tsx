import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import type { ServiceEmptyStateProps } from "../types";

export function ServiceEmptyState({ onCreate }: ServiceEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">
          No hay servicios médicos creados aún
        </p>
        <Button variant="outline" className="mt-4" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Crear primer servicio
        </Button>
      </CardContent>
    </Card>
  );
}
