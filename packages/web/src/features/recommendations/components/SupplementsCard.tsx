import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientRecommendations } from "../schema";

interface SupplementsCardProps {
  data?: ClientRecommendations["supplementsRoutine"];
}

interface SupplementItem {
  product: string;
  dose: string;
  benefit: string;
}

function SupplementList({
  items,
  title,
  icon,
}: {
  items?: SupplementItem[];
  title: string;
  icon: string;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <span>{icon}</span> {title}
      </h4>
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-3 p-3 bg-muted rounded-lg"
          >
            <div className="flex-1">
              <div className="font-medium text-sm">{item.product}</div>
              <div className="text-xs text-muted-foreground">{item.dose}</div>
              <div className="text-xs text-green-600 mt-1">{item.benefit}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SupplementsCard({ data }: SupplementsCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💊</span> Rutina de Suplementación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-muted rounded" />
                <div className="h-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💊</span> Rutina de Suplementación
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Reto de 7 días - Productos Herbalife
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <SupplementList
          items={data.morning}
          title="Al despertar (en ayunas)"
          icon="🌅"
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground px-2">
          <div className="flex-1 h-px bg-border" />
          <span>Esperar 30 min</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <SupplementList items={data.breakfast} title="Con el desayuno" icon="🍳" />

        {data.evening && data.evening.length > 0 && (
          <SupplementList items={data.evening} title="Por la noche" icon="🌙" />
        )}
      </CardContent>
    </Card>
  );
}
