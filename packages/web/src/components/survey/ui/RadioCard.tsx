import { cn } from "@/lib/utils"

interface RadioCardOption<T extends string> {
  value: T
  label: string
}

interface RadioCardGroupProps<T extends string> {
  options: RadioCardOption<T>[]
  value: T | undefined
  onChange: (value: T) => void
  name: string
  className?: string
}

export function RadioCardGroup<T extends string>({
  options,
  value,
  onChange,
  name,
  className,
}: RadioCardGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={name}
      className={cn("flex gap-3", className)}
    >
      {options.map((option) => (
        <RadioCard
          key={option.value}
          option={option}
          isSelected={value === option.value}
          onSelect={() => onChange(option.value)}
          name={name}
        />
      ))}
    </div>
  )
}

interface RadioCardProps<T extends string> {
  option: RadioCardOption<T>
  isSelected: boolean
  onSelect: () => void
  name: string
}

function RadioCard<T extends string>({
  option,
  isSelected,
  onSelect,
  name,
}: RadioCardProps<T>) {
  return (
    <label
      className={cn(
        "flex-1 flex items-center justify-center min-h-[52px] px-4 py-3 rounded-lg border cursor-pointer transition-all",
        "hover:border-primary/50 active:scale-[0.98]",
        "focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2",
        isSelected
          ? "bg-primary/10 border-primary text-foreground"
          : "bg-card border-border hover:bg-accent/50"
      )}
    >
      <input
        type="radio"
        name={name}
        value={option.value}
        checked={isSelected}
        onChange={onSelect}
        className="sr-only"
      />
      <span className="text-sm font-medium">{option.label}</span>
    </label>
  )
}
