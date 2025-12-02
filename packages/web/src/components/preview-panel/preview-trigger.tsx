import { Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/use-mobile"
import { usePreviewPanel } from "./preview-context"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export function PreviewTrigger() {
  const isMobile = useIsMobile()
  const { toggle, isOpen } = usePreviewPanel()

  // Only show on desktop
  if (isMobile) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isOpen ? "default" : "outline"}
            size="icon"
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
            onClick={toggle}
          >
            <Smartphone className="h-6 w-6" />
            <span className="sr-only">
              {isOpen ? "Cerrar vista previa" : "Ver vista previa"}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{isOpen ? "Cerrar vista previa" : "Ver vista previa"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
