import { memo } from "react";
import type { TextAIPart } from "./types";
import { MessageResponse } from "@/components/ai-elements/message";

interface TextPartProps {
  part: TextAIPart;
}

export const TextPart = memo(({ part }: TextPartProps) => {
  if (!part.text) return null;

  return (
    <div className="ai-text text-sm leading-relaxed text-foreground">
      <MessageResponse>{part.text}</MessageResponse>
    </div>
  );
});

TextPart.displayName = "TextPart";

export default TextPart;
