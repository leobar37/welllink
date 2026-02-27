import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
} from "lucide-react";
import type { Client } from "@/hooks/use-clients";

interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (id: string) => void;
  onViewNotes?: (client: Client) => void;
}

const labelConfig = {
  consumidor: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    icon: "bg-blue-100 text-blue-600",
  },
  prospecto: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    icon: "bg-emerald-100 text-emerald-600",
  },
  afiliado: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    icon: "bg-amber-100 text-amber-600",
  },
} as const;

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ClientCard({
  client,
  onEdit,
  onDelete,
  onViewNotes,
}: ClientCardProps) {
  const config = labelConfig[client.label];

  return (
    <Card className="group border-0 shadow-none bg-card hover:bg-accent/30 transition-all duration-200 cursor-pointer">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className={`h-12 w-12 ${config.icon}`}>
            <AvatarFallback
              className={`${config.bg} ${config.text} font-semibold text-sm`}
            >
              {getInitials(client.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground text-lg leading-tight">
                  {client.name}
                </h3>
                <Badge
                  variant="secondary"
                  className={`${config.bg} ${config.text} border-0 text-xs font-medium`}
                >
                  {client.label}
                </Badge>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity -mr-2"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {onViewNotes && (
                    <DropdownMenuItem onClick={() => onViewNotes(client)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Ver notas
                    </DropdownMenuItem>
                  )}
                  {onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(client)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </DropdownMenuItem>
                  )}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={() => onDelete(client.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                <span>{client.phone}</span>
              </div>

              {client.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[200px]">{client.email}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {new Date(client.createdAt).toLocaleDateString("es-ES")}
                </span>
              </div>
            </div>

            {client.notes && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2 bg-muted/50 rounded-lg px-3 py-2">
                {client.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
