import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "@/components/ui/button";

function getErrorCopy(error: unknown) {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        title: "No encontramos esta página",
        description:
          "La ruta que intentaste abrir no existe o ya no está disponible.",
        details: `${error.status} ${error.statusText}`,
      };
    }

    return {
      title: "No pudimos cargar esta pantalla",
      description:
        error.data && typeof error.data === "string"
          ? error.data
          : "Ocurrió un problema inesperado al abrir esta sección.",
      details: `${error.status} ${error.statusText}`,
    };
  }

  if (error instanceof Error) {
    return {
      title: "Ocurrió un error inesperado",
      description:
        "La aplicación encontró un problema y no pudo renderizar esta pantalla correctamente.",
      details: error.message,
      stack: error.stack,
    };
  }

  return {
    title: "Ocurrió un error inesperado",
    description:
      "La aplicación encontró un problema y no pudo continuar con esta vista.",
  };
}

export function AppErrorBoundary() {
  const error = useRouteError();
  const copy = getErrorCopy(error);

  return (
    <div className="min-h-screen bg-background px-6 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-3xl items-center justify-center">
        <div className="w-full rounded-3xl border border-border/60 bg-card/95 p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-destructive">
              Error de aplicación
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {copy.title}
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {copy.description}
            </p>
          </div>

          {copy.details ? (
            <div className="mt-6 rounded-2xl border border-border/60 bg-muted/40 p-4">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Detalle
              </p>
              <p className="mt-2 break-words text-sm text-foreground">
                {copy.details}
              </p>
            </div>
          ) : null}

          {import.meta.env.DEV && copy.stack ? (
            <details className="mt-6 rounded-2xl border border-border/60 bg-muted/30 p-4">
              <summary className="cursor-pointer text-sm font-medium">
                Ver stack trace
              </summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
                {copy.stack}
              </pre>
            </details>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              Recargar página
            </Button>
            <Button variant="outline" asChild>
              <a href="/">
                <Home className="h-4 w-4" />
                Ir al inicio
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
