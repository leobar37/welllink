import { useState, type KeyboardEvent } from "react";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface KeywordInputProps {
  keywords: string[];
  onChange: (keywords: string[]) => void;
  disabled?: boolean;
  maxKeywords?: number;
  placeholder?: string;
}

export function KeywordInput({
  keywords,
  onChange,
  disabled = false,
  maxKeywords = 10,
  placeholder = "Escribe una palabra clave y presiona Enter",
}: KeywordInputProps) {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim().toLowerCase();
    const isValid =
      trimmed.length >= 2 &&
      !keywords.includes(trimmed) &&
      keywords.length < maxKeywords;

    if (!isValid) return;

    onChange([...keywords, trimmed]);
    setInputValue("");
  };

  const handleRemove = (keywordToRemove: string) => {
    onChange(keywords.filter((k) => k !== keywordToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
      return;
    }

    const shouldRemoveLast =
      e.key === "Backspace" && !inputValue && keywords.length > 0;
    if (shouldRemoveLast) {
      onChange(keywords.slice(0, -1));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || keywords.length >= maxKeywords}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleAdd}
          disabled={
            disabled || !inputValue.trim() || keywords.length >= maxKeywords
          }
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {keywords.map((keyword, index) => (
            <Badge
              key={`${keyword}-${index}`}
              variant="secondary"
              className="gap-1 px-2 py-1"
            >
              <span>{keyword}</span>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(keyword)}
                  className="ml-1 hover:text-destructive focus:outline-none"
                  aria-label={`Eliminar ${keyword}`}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {keywords.length} de {maxKeywords} palabras clave
        {keywords.length >= maxKeywords && (
          <span className="text-destructive ml-1">(Límite alcanzado)</span>
        )}
      </p>
    </div>
  );
}
