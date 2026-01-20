import * as React from "react";

import { cn } from "@/lib/utils";

export interface NumberInputProps extends Omit<
  React.ComponentProps<"input">,
  "onChange" | "value" | "defaultValue"
> {
  /**
   * Optional default value when input is cleared.
   * Useful for optional number fields that should become undefined when empty.
   * @default undefined
   */
  emptyValue?: number | undefined;
  value?: number | undefined;
  onChange?: (value: number | undefined) => void;
}

function NumberInput({
  className,
  type,
  emptyValue = undefined,
  value,
  onChange,
  ...props
}: NumberInputProps) {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const stringValue = event.target.value;

    // Handle empty string - convert to the emptyValue (default: undefined)
    if (stringValue === "") {
      onChange?.(emptyValue);
      return;
    }

    // Parse the number
    const numericValue = Number(stringValue);
    onChange?.(numericValue);
  };

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground/60 selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input/60 h-10 w-full min-w-0 rounded-lg border bg-transparent px-3 py-2 text-base transition-all outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-primary focus-visible:ring-primary/20 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className,
      )}
      value={value ?? ""}
      onChange={handleChange}
      {...props}
    />
  );
}

export { NumberInput };
