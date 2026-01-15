import { useState } from "react";
import { Loader2, Plus, Edit, Trash2, X } from "lucide-react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClientNotes, type ClientNote } from "@/hooks/use-client-notes";
import type { Client } from "@/hooks/use-clients";

interface ClientNotesModalProps {
  client: Client;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientNotesModal({ client, open, onOpenChange }: ClientNotesModalProps) {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useClientNotes(client.id);
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    await addNote.mutateAsync(newNote);
    setNewNote("");
  };

  const handleStartEdit = (note: ClientNote) => {
    setEditingNoteId(note.id);
    setEditingText(note.note);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editingText.trim()) return;
    await updateNote.mutateAsync({ noteId, note: editingText });
    setEditingNoteId(null);
    setEditingText("");
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingText("");
  };

  const handleDelete = async (noteId: string) => {
    if (confirm("¿Estás seguro de eliminar esta nota?")) {
      await deleteNote.mutateAsync(noteId);
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Notas de ${client.name}`}
      description="Gestiona las notas de este cliente"
    >
      <div className="space-y-4">
        {/* Form to add new note */}
        <div className="space-y-2">
          <Textarea
            placeholder="Agregar una nueva nota..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || addNote.isPending}
            className="w-full"
          >
            {addNote.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Agregar Nota
              </>
            )}
          </Button>
        </div>

        {/* Notes list */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : notes && notes.length > 0 ? (
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {notes.map((note) => (
              <Card key={note.id} className="group">
                <CardContent className="p-3">
                  {editingNoteId === note.id ? (
                    // Editing mode
                    <div className="space-y-2">
                      <Textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(note.id)}
                          disabled={!editingText.trim() || updateNote.isPending}
                        >
                          Guardar
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="relative">
                      <p className="text-sm whitespace-pre-wrap">{note.note}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(note.createdAt).toLocaleDateString("es-ES", {
                          dateStyle: "medium",
                        })}
                      </p>
                      <div className="absolute top-0 right-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <X className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStartEdit(note)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(note.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>No hay notas aún.</p>
            <p className="text-sm">Agrega la primera nota arriba.</p>
          </div>
        )}
      </div>
    </ResponsiveDialog>
  );
}
