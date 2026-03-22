import { AlertCircle, RefreshCw } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ChatErrorBoundaryProps {
  children: ReactNode;
}

interface ChatErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class ChatErrorBoundary extends Component<
  ChatErrorBoundaryProps,
  ChatErrorBoundaryState
> {
  state: ChatErrorBoundaryState = {
    hasError: false,
    errorMessage: null,
  };

  static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "Error desconocido en el chat.",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Chat widget crashed", { error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: null });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-border/60 bg-background px-5 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-base font-semibold">
            El chat no está disponible
          </h2>
          <p className="text-sm text-muted-foreground">
            Ocurrió un problema al cargar el asistente. Puedes intentar de nuevo
            sin salir de esta página.
          </p>
          {this.state.errorMessage ? (
            <p className="text-xs text-muted-foreground">
              Detalle: {this.state.errorMessage}
            </p>
          ) : null}
        </div>
        <Button onClick={this.handleReset} variant="outline">
          <RefreshCw className="h-4 w-4" />
          Reintentar chat
        </Button>
      </div>
    );
  }
}
