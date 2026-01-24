import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Clock,
  Users,
  Edit2,
  Trash2,
  Eye,
  MoreHorizontal,
  CheckCircle2,
  XCircle,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { SlotStatusBadge, SlotStatusDot } from "./slot-status-badge";
import type { TimeSlot } from "@/hooks/use-slots";

interface SlotCardProps {
  slot: TimeSlot;
  onBlock?: (slotId: string) => void;
  onUnblock?: (slotId: string) => void;
  onDelete?: (slotId: string) => void;
  onEdit?: (slot: TimeSlot) => void;
  onViewClient?: (slot: TimeSlot) => void;
  className?: string;
}

export function SlotCard({
  slot,
  onBlock,
  onUnblock,
  onDelete,
  onEdit,
  onViewClient,
  className,
}: SlotCardProps) {
  const startTime = new Date(slot.startTime);
  const endTime = new Date(slot.endTime);
  const isAvailable = slot.status === "available";
  const isBlocked = slot.status === "blocked";
  const isReserved =
    slot.status === "reserved" || slot.status === "pending_approval";

  const formatTime = (date: Date) => format(date, "HH:mm");

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        isBlocked && "opacity-60",
        className,
      )}
    >
      <CardContent className="flex items-center justify-between p-4">
        {/* Time and Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <SlotStatusDot
              variant={
                isBlocked ? "blocked" : isReserved ? "reserved" : "available"
              }
            />
          </div>

          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <span className="font-semibold text-lg">
              {formatTime(startTime)} - {formatTime(endTime)}
            </span>
          </div>

          <SlotStatusBadge
            variant={
              isBlocked ? "blocked" : isReserved ? "reserved" : "available"
            }
            showIcon={false}
          />
        </div>

        {/* Reservations count */}
        {isAvailable && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Users className="size-4" />
            <span>
              {slot.currentReservations}/{slot.maxReservations}
            </span>
          </div>
        )}

        {/* Reserved client info */}
        {isReserved && (
          <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
            <Calendar className="size-4" />
            <span>Cliente reservado</span>
          </div>
        )}

        {/* Blocked info */}
        {isBlocked && (
          <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
            <XCircle className="size-4" />
            <span>Bloqueado</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1">
          {onEdit && isAvailable && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(slot)}
              className="size-8"
            >
              <Edit2 className="size-4" />
            </Button>
          )}

          {onViewClient && isReserved && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewClient(slot)}
              className="size-8"
            >
              <Eye className="size-4" />
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {isAvailable && onBlock && (
                <DropdownMenuItem onClick={() => onBlock(slot.id)}>
                  <XCircle className="size-4 mr-2" />
                  Bloquear slot
                </DropdownMenuItem>
              )}
              {isBlocked && onUnblock && (
                <DropdownMenuItem onClick={() => onUnblock(slot.id)}>
                  <CheckCircle2 className="size-4 mr-2" />
                  Desbloquear slot
                </DropdownMenuItem>
              )}
              {isAvailable && onEdit && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(slot)}>
                    <Edit2 className="size-4 mr-2" />
                    Editar horario
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {isReserved && onViewClient && (
                <DropdownMenuItem onClick={() => onViewClient(slot)}>
                  <Eye className="size-4 mr-2" />
                  Ver cliente
                </DropdownMenuItem>
              )}
              {!isReserved && !isBlocked && onDelete && (
                <DropdownMenuSeparator />
              )}
              {!isReserved && !isBlocked && onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(slot.id)}
                  className="text-destructive"
                >
                  <Trash2 className="size-4 mr-2" />
                  Eliminar slot
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact slot card for grid views
interface CompactSlotCardProps {
  slot: TimeSlot;
  onClick?: () => void;
  className?: string;
}

export function CompactSlotCard({
  slot,
  onClick,
  className,
}: CompactSlotCardProps) {
  const startTime = new Date(slot.startTime);
  const endTime = new Date(slot.endTime);
  const isAvailable = slot.status === "available";
  const isBlocked = slot.status === "blocked";
  const isReserved =
    slot.status === "reserved" || slot.status === "pending_approval";

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-all text-left w-full",
        isAvailable &&
          "bg-emerald-50 border-emerald-200 hover:border-emerald-300 dark:bg-emerald-950/20 dark:border-emerald-800",
        isReserved &&
          "bg-amber-50 border-amber-200 hover:border-amber-300 dark:bg-amber-950/20 dark:border-amber-800",
        isBlocked &&
          "bg-red-50 border-red-200 hover:border-red-300 dark:bg-red-950/20 dark:border-red-800",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <SlotStatusDot
          variant={
            isBlocked ? "blocked" : isReserved ? "reserved" : "available"
          }
        />
        <div>
          <div className="font-semibold">
            {format(startTime, "HH:mm")} - {format(endTime, "HH:mm")}
          </div>
          <div className="text-xs text-muted-foreground">
            {slot.currentReservations}/{slot.maxReservations} reservas
          </div>
        </div>
      </div>

      <SlotStatusBadge
        variant={isBlocked ? "blocked" : isReserved ? "reserved" : "available"}
        showIcon={false}
      />
    </button>
  );
}

// Day slot group header
interface DaySlotHeaderProps {
  date: Date;
  slotCount: number;
  availableCount: number;
  reservedCount: number;
}

export function DaySlotHeader({
  date,
  slotCount,
  availableCount,
  reservedCount,
}: DaySlotHeaderProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b">
      <div>
        <h3 className="font-semibold capitalize">
          {format(date, "EEEE, d 'de' MMMM", { locale: es })}
        </h3>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{slotCount} slots</span>
          <span className="text-emerald-600">{availableCount} disponibles</span>
          {reservedCount > 0 && (
            <span className="text-amber-600">{reservedCount} reservados</span>
          )}
        </div>
      </div>
    </div>
  );
}
