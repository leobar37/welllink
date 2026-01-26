"use client";

import { CodeBlock } from "@/components/ai-elements/code-block";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import { memo } from "react";
import type { ToolResultAIPart } from "./types";

export interface ToolResultPartProps {
  part: ToolResultAIPart;
  className?: string;
}

export const ToolResultPart = memo(({ part, className }: ToolResultPartProps) => {
  const isError = !!part.errorText;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border p-3",
        isError ? "border-destructive/20 bg-destructive/5" : "bg-muted/30",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex size-6 items-center justify-center rounded-full",
            isError ? "bg-destructive/10" : "bg-green-500/10"
          )}
        >
          {isError ? (
            <XCircle className="size-3.5 text-destructive" />
          ) : (
            <CheckCircle2 className="size-3.5 text-green-600" />
          )}
        </div>
        <span className="font-medium text-sm text-muted-foreground">
          Tool Result
        </span>
        <Badge
          variant={isError ? "destructive" : "outline"}
          className="font-mono text-xs"
        >
          {part.toolName}
        </Badge>
      </div>

      <div className="pl-8">
        {isError ? (
          <div className="rounded-md bg-destructive/10 p-2 text-xs text-destructive font-mono">
            {part.errorText}
          </div>
        ) : (
          <div className="rounded-md bg-muted/50 text-xs">
            <CodeBlock
              code={
                typeof part.output === "string"
                  ? part.output
                  : JSON.stringify(part.output, null, 2)
              }
              language="json"
            />
          </div>
        )}
      </div>
    </div>
  );
});

ToolResultPart.displayName = "ToolResultPart";
