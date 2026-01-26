"use client";

import { CodeBlock } from "@/components/ai-elements/code-block";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Wrench } from "lucide-react";
import { memo } from "react";
import type { ToolCallAIPart } from "./types";

export interface ToolCallPartProps {
  part: ToolCallAIPart;
  className?: string;
}

export const ToolCallPart = memo(({ part, className }: ToolCallPartProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border bg-muted/30 p-3",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-muted">
          <Wrench className="size-3.5 text-muted-foreground" />
        </div>
        <span className="font-medium text-sm text-muted-foreground">
          Calling Tool
        </span>
        <Badge variant="outline" className="font-mono text-xs">
          {part.toolName}
        </Badge>
      </div>
      
      <div className="pl-8">
        <div className="rounded-md bg-muted/50 text-xs">
          <CodeBlock 
            code={JSON.stringify(part.input, null, 2)} 
            language="json" 
          />
        </div>
      </div>
    </div>
  );
});

ToolCallPart.displayName = "ToolCallPart";
