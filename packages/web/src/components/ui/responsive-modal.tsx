import * as React from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";

interface ResponsiveModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title: string;
  description?: string;
  className?: string;
  footer?: React.ReactNode;
}

/**
 * Componente que renderiza Sheet en desktop y Drawer en mobile
 *
 * - Mobile (< 768px): Drawer desde abajo (bottom sheet)
 * - Desktop (≥ 768px): Sheet lateral derecho (side="right")
 *
 * @example
 * ```tsx
 * <ResponsiveModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Título"
 *   description="Descripción opcional"
 * >
 *   <div>Contenido del modal</div>
 * </ResponsiveModal>
 * ```
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  className,
  footer,
}: ResponsiveModalProps) {
  const isMobile = useIsMobile();

  // Mobile: Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className={cn(
            "max-h-[85vh] overflow-y-auto",
            className
          )}
        >
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {children}
          </div>
          {footer && (
            <DrawerFooter className="border-t pt-4 mt-auto">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Sheet (side sheet)
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className={cn("max-w-2xl overflow-y-auto", className)}
      >
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && (
            <SheetDescription>{description}</SheetDescription>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {children}
        </div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4 border-t">
            {footer}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
