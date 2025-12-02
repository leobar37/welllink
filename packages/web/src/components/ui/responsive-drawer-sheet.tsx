import * as React from "react";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

interface ResponsiveDrawerSheetProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResponsiveDrawerSheet({
  children,
  title,
  description,
  trigger,
  open,
  onOpenChange,
}: ResponsiveDrawerSheetProps) {
  const { isMd } = useBreakpoint();

  // On desktop (md+), use Sheet from the right
  if (isMd) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            {title && <SheetTitle>{title}</SheetTitle>}
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6 -mr-6 pr-6">
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // On mobile, use Drawer from the bottom
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          {title && <DrawerTitle>{title}</DrawerTitle>}
          {description && <DrawerDescription>{description}</DrawerDescription>}
        </DrawerHeader>
        <div className="px-4 pb-4 max-h-[calc(100vh-8rem)] overflow-y-auto">
          {children}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
