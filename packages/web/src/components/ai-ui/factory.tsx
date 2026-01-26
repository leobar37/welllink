import { memo } from "react";
import type { AIMessagePart, AIUIHandlers } from "./types";
import { TextPart } from "./text-part";
import { ServicesPart } from "./services-part";
import { AvailabilityPart } from "./availability-part";
import { ReservationPart } from "./reservation-part";
import { FAQPart } from "./faq-part";
import { CalendarPart } from "./calendar-part";
import { PatientFormPart } from "./patient-form-part";
import { ConfirmationPart } from "./confirmation-part";
import { ToolCallPart } from "./tool-call-part";
import { ToolResultPart } from "./tool-result-part";

interface PartRendererProps {
  part: AIMessagePart;
  handlers: AIUIHandlers;
}

const PartRenderer = memo(({ part, handlers }: PartRendererProps) => {
  switch (part.type) {
    case "text":
      return <TextPart part={part} />;
    case "services-list":
      return <ServicesPart part={part} handlers={handlers} />;
    case "availability":
      return <AvailabilityPart part={part} handlers={handlers} />;
    case "reservation":
      return <ReservationPart part={part} handlers={handlers} />;
    case "faq":
      return <FAQPart part={part} handlers={handlers} />;
    case "calendar":
      return <CalendarPart part={part} handlers={handlers} />;
    case "patient-form":
      return <PatientFormPart part={part} handlers={handlers} />;
    case "confirmation":
      return <ConfirmationPart part={part} handlers={handlers} />;
    case "tool-call":
      return <ToolCallPart part={part} />;
    case "tool-result":
      return <ToolResultPart part={part} />;
    default:
      return null;
  }
});

PartRenderer.displayName = "PartRenderer";

interface MessageRendererProps {
  parts: AIMessagePart[];
  handlers?: AIUIHandlers;
}

export const MessageRenderer = memo(
  ({ parts, handlers }: MessageRendererProps) => {
    return (
      <div className="ai-message space-y-2">
        {parts.map((part, index) => (
          <PartRenderer
            key={part.id || index}
            part={part}
            handlers={handlers || {}}
          />
        ))}
      </div>
    );
  },
);

MessageRenderer.displayName = "MessageRenderer";

export default MessageRenderer;
