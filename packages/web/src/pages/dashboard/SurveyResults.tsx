import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemActions,
  ItemTitle,
} from "@/components/ui/item";

type SurveyResponse = {
  id: string;
  createdAt: string;
  visitorName?: string | null;
  visitorWhatsapp?: string | null;
  responses?: {
    goal?: string | null;
  } | null;
  status?: string | null;
};

export function SurveyResults() {
  const { profile } = useProfile();
  const { isMd } = useBreakpoint();
  const isMobileView = !isMd;

  // Estado para filtros y sorting
  const [sorting, setSorting] = useState<SortingState>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState("all");

  const { data: surveys = [], isLoading } = useQuery<SurveyResponse[]>({
    queryKey: ["surveys", profile?.id],
    queryFn: async () => {
      if (!profile?.id) return [];
      const { data, error } = await api.api["health-survey"].get({
        $query: { profileId: profile.id },
      });
      if (error) throw error;
      return Array.isArray(data) ? (data as SurveyResponse[]) : [];
    },
    enabled: !!profile?.id,
  });

  // Filtrar datos
  const filteredData = useMemo(() => {
    return surveys.filter((survey) => {
      const statusMatch = statusFilter === "all" || survey.status === statusFilter;
      const goalMatch = goalFilter === "all" || survey.responses?.goal === goalFilter;
      return statusMatch && goalMatch;
    });
  }, [surveys, statusFilter, goalFilter]);

  // Definir columnas para TanStack Table
  const columns = useMemo<ColumnDef<SurveyResponse>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Fecha
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const date = new Date(row.getValue("createdAt"));
          return (
            <div className="text-sm">
              {format(date, "MMM d, yyyy")}
            </div>
          );
        },
      },
      {
        accessorKey: "visitorName",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Nombre
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const name = row.getValue("visitorName") as string;
          return (
            <div className="font-medium text-sm">
              {name || "Sin nombre"}
            </div>
          );
        },
      },
      {
        accessorKey: "responses.goal",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Objetivo
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const goal = row.original.responses?.goal;
          return (
            <Badge variant="secondary" className="capitalize text-xs">
              {goal ? goal.replace(/_/g, " ") : "Desconocido"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "visitorWhatsapp",
        header: "WhatsApp",
        cell: ({ row }) => {
          const whatsapp = row.getValue("visitorWhatsapp") as string;
          return (
            <div className="text-sm">
              {whatsapp ? (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary hover:underline"
                >
                  {whatsapp}
                </a>
              ) : (
                "-"
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
              className="h-8 px-2 lg:px-3"
            >
              Estado
              <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
          );
        },
        cell: ({ row }) => {
          const status = row.getValue("status") as string;
          return (
            <Badge
              variant={status === "new" ? "default" : "outline"}
            >
              {status || "Nuevo"}
            </Badge>
          );
        },
      },
    ],
    []
  );

  // Configurar tabla
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Resultados de Encuestas
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Respuestas Recientes</CardTitle>
          <CardDescription>
            Ver quién ha completado tu encuesta de salud.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros */}
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="new">Nuevo</SelectItem>
                <SelectItem value="read">Leído</SelectItem>
              </SelectContent>
            </Select>

            <Select value={goalFilter} onValueChange={setGoalFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="perder_peso">Perder peso</SelectItem>
                <SelectItem value="ganar_musculo">Ganar músculo</SelectItem>
                <SelectItem value="mantener_salud">Mantener salud</SelectItem>
                <SelectItem value="rehabilitacion">Rehabilitación</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contenido Principal */}
          {isMobileView ? (
            // Vista Móvil: Item layout
            <div className="space-y-3">
              {table.getRowModel().rows.length > 0 ? (
                <ItemGroup role="list" aria-label="Resultados de encuesta">
                  {table.getRowModel().rows.map((row) => (
                    <Item
                      key={row.id}
                      variant="outline"
                      role="listitem"
                      className="p-4"
                    >
                      <ItemHeader className="basis-full">
                        <div className="flex justify-between items-start gap-4 w-full">
                          <ItemContent className="flex-1 min-w-0">
                            <ItemTitle className="truncate">
                              {row.original.visitorName || "Sin nombre"}
                            </ItemTitle>
                            <ItemDescription>
                              {format(new Date(row.original.createdAt), "MMM d, yyyy")}
                            </ItemDescription>
                          </ItemContent>
                          <ItemActions>
                            <Badge
                              variant={
                                row.original.status === "new" ? "default" : "outline"
                              }
                              className="shrink-0"
                            >
                              {row.original.status || "Nuevo"}
                            </Badge>
                          </ItemActions>
                        </div>
                      </ItemHeader>

                      <div className="space-y-2 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Objetivo:</span>
                          <Badge
                            variant="secondary"
                            className="capitalize text-xs"
                          >
                            {row.original.responses?.goal?.replace(/_/g, " ") ||
                              "Desconocido"}
                          </Badge>
                        </div>

                        {row.original.visitorWhatsapp && (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">WhatsApp:</span>
                            <a
                              href={`https://wa.me/${row.original.visitorWhatsapp.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-primary hover:underline"
                            >
                              {row.original.visitorWhatsapp}
                            </a>
                          </div>
                        )}
                      </div>
                    </Item>
                  ))}
                </ItemGroup>
              ) : (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                  Aún no hay respuestas de encuestas.
                </div>
              )}

              {/* Paginación Móvil */}
              {table.getFilteredRowModel().rows.length > table.getState().pagination.pageSize && (
                <div className="flex items-center justify-between text-sm pt-4">
                  <span className="text-muted-foreground">
                    {table.getRowModel().rows.length} de{" "}
                    {table.getFilteredRowModel().rows.length} resultados
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    Ver más
                  </Button>
                </div>
              )}
            </div>
          ) : (
            // Vista Desktop: Table layout
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} className="whitespace-nowrap">
                            {header.isPlaceholder
                              ? null
                              : header.column.getCanSort()
                              ? (
                                  <div className="flex items-center">
                                    {flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                                  </div>
                                )
                                : flexRender(
                                    header.column.columnDef.header,
                                    header.getContext()
                                  )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="whitespace-nowrap">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="text-center h-24 text-muted-foreground"
                        >
                          Aún no hay respuestas de encuestas.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación Desktop */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando{" "}
                  {table.getRowModel().rows.length > 0
                    ? `${table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}`
                    : "0"}{" "}
                  a{" "}
                  {table.getRowModel().rows.length > 0
                    ? `${Math.min(
                        (table.getState().pagination.pageIndex + 1) *
                          table.getState().pagination.pageSize,
                        table.getFilteredRowModel().rows.length
                      )}`
                    : "0"}{" "}
                  de {table.getFilteredRowModel().rows.length} resultados
                </div>

                <div className="flex items-center gap-4">
                  <Select
                    value={table.getState().pagination.pageSize.toString()}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue placeholder={table.getState().pagination.pageSize} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <span className="text-sm">
                      Página {table.getState().pagination.pageIndex + 1} de{" "}
                      {table.getPageCount()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Helper para renderizado flexible
import { type Renderer } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
