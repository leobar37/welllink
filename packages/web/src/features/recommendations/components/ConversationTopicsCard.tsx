import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AdvisorNotes } from "../schema";

interface ConversationTopicsCardProps {
  data?: AdvisorNotes["conversationTopics"];
}

export function ConversationTopicsCard({ data }: ConversationTopicsCardProps) {
  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💬</span> Temas de Conversación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>💬</span> Temas de Conversación
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay temas de conversación sugeridos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>💬</span> Temas de Conversación
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Puntos a tocar para conectar con el cliente
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {data.map((topic, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/50 rounded-lg"
          >
            <span className="text-blue-600 text-sm mt-0.5">💡</span>
            <span className="text-sm">{topic}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
