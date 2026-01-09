import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2, MessageSquare } from "lucide-react";
import type { Client } from "@/hooks/use-clients";

interface ClientCardProps {
  client: Client;
  onEdit?: (client: Client) => void;
  onDelete?: (id: string) => void;
  onViewNotes?: (client: Client) => void;
}

const labelColors = {
  consumidor: "bg-blue-100 text-blue-800 border-blue-200",
  prospecto: "bg-green-100 text-green-800 border-green-200",
  afiliado: "bg-orange-100 text-orange-800 border-orange-200",
} as const;

export function ClientCard({ client, onEdit, onDelete, onViewNotes }: ClientCardProps) {
  return (
    <Card className="hover:bg-muted/5 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-foreground truncate">{client.name}</h3>
              <Badge
                variant="outline"
                className={labelColors[client.label]}
              >
                {client.label}
              </Badge>
            </div>

            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="font-medium">Tel:</span>
                <span>{client.phone}</span>
              </div>
              {client.email && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span className="truncate">{client.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-medium">Creado:</span>
                <span>{new Date(client.createdAt).toLocaleDateString("es-ES")}</span>
              </div>
            </div>

            {client.notes && (
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {client.notes}
              </p>
            )}
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
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
      </CardContent>
    </Card>
  );
}
