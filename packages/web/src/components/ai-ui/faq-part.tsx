import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAQAIPart, AIUIHandlers, FAQItem } from "./types";

interface FAQPartProps {
  part: FAQAIPart;
  handlers: AIUIHandlers;
}

export const FAQPart = memo(({ part, handlers }: FAQPartProps) => {
  return (
    <div className="space-y-3 my-4">
      {part.category && (
        <p className="text-sm font-medium text-muted-foreground">
          Preguntas frecuentes sobre {part.category}:
        </p>
      )}
      <div className="space-y-2">
        {part.faqs?.map((item, index) => (
          <FAQItemCard
            key={index}
            item={item}
            index={index}
            onSelect={handlers.onSelectFAQ}
          />
        ))}
      </div>
    </div>
  );
});

interface FAQItemCardProps {
  item: FAQItem;
  index: number;
  onSelect?: (item: FAQItem) => void;
}

const FAQItemCard = memo(({ item, index, onSelect }: FAQItemCardProps) => {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md",
        "hover:border-primary/50",
      )}
      onClick={() => onSelect?.(item)}
    >
      <CardHeader className="p-3 pb-1">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-primary mt-0.5" />
          <CardTitle className="text-sm font-medium leading-tight">
            {item.question}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {item.answer}
        </p>
        <Badge variant="outline" className="mt-2 text-xs">
          Pregunta #{index + 1}
        </Badge>
      </CardContent>
    </Card>
  );
});

FAQItemCard.displayName = "FAQItemCard";
FAQPart.displayName = "FAQPart";

export default FAQPart;
