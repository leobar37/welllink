import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MessageCircle, Play, Phone, Clock, User } from "lucide-react";
import {
  usePausedConversations,
  type WhatsAppContext,
} from "@/hooks/use-conversations";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function Conversations() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { pausedConversations, isLoading, resumeConversation } =
    usePausedConversations();

  const handleResume = async (phone: string) => {
    await resumeConversation(phone);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAUSED_FOR_HUMAN":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            Esperando humano
          </span>
        );
      case "TRANSFERRED_TO_WIDGET":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Transferido al chat
          </span>
        );
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Activo
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getLastMessage = (conversation: WhatsAppContext) => {
    const history = conversation.conversationHistory || [];
    const lastUserMessage = history.filter((m) => m.role === "user").pop();
    return lastUserMessage?.content || "Sin mensajes";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las conversaciones de WhatsApp que esperan atención humana
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="PAUSED_FOR_HUMAN">Esperando humano</SelectItem>
            <SelectItem value="TRANSFERRED_TO_WIDGET">
              Transferido al chat
            </SelectItem>
            <SelectItem value="ACTIVE">Activo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {pausedConversations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No hay conversaciones en espera
              </p>
              <p className="text-sm text-muted-foreground text-center mt-1">
                Las conversaciones que requieren atención humana aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          pausedConversations.map((conversation) => (
            <Card key={conversation.phone}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100">
                      <Phone className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {conversation.phone}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusBadge(conversation.status)}
                        {conversation.pausedForHumanAt && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(
                              new Date(conversation.pausedForHumanAt),
                              {
                                locale: es,
                                addSuffix: true,
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResume(conversation.phone)}
                    className="gap-2"
                  >
                    <Play className="h-4 w-4" />
                    Reanudar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversation.contextSummary && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Resumen: </span>
                      {conversation.contextSummary}
                    </div>
                  )}
                  <div className="bg-muted rounded-lg p-3 text-sm">
                    <div className="font-medium text-xs text-muted-foreground mb-1">
                      Último mensaje:
                    </div>
                    {getLastMessage(conversation)}
                  </div>
                  {conversation.patientId && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      Vinculado a cliente ID: {conversation.patientId}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
