import { useState } from "react";
import { Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { useProfile } from "@/hooks/use-profile";
import { usePreviewPanel } from "./preview-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

function PreviewIframe({
  username,
  refreshKey,
}: {
  username: string;
  refreshKey: number;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const profileUrl = `/${username}?preview=1&t=${refreshKey}`;

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <iframe
        src={profileUrl}
        className="w-full h-full border-0"
        onLoad={() => setIsLoading(false)}
        title="Vista previa del perfil"
      />
    </>
  );
}

export function PreviewPanel() {
  const { isOpen, close, refreshKey, refresh } = usePreviewPanel();
  const { profile } = useProfile();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col p-0"
      >
        <SheetHeader className="px-6 py-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>Vista Previa</SheetTitle>
              <SheetDescription>Así se ve tu perfil público</SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={refresh}
                title="Recargar"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              {profile?.username && (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={`/${profile.username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Abrir
                  </a>
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-hidden">
          {/* Phone frame mockup */}
          <div className="h-full p-4 flex justify-center">
            <div className="relative w-full max-w-[375px] h-full min-h-[500px]">
              {/* Phone bezel */}
              <div className="absolute inset-0 rounded-[2.5rem] border-[8px] border-foreground/10 bg-background shadow-xl overflow-hidden">
                {/* Notch */}
                <div className="absolute left-1/2 top-2 h-6 w-24 -translate-x-1/2 rounded-full bg-foreground/10 z-20" />

                {/* Screen content - iframe */}
                <div className="relative h-full pt-8 overflow-hidden rounded-[2rem]">
                  {profile?.username ? (
                    <PreviewIframe
                      username={profile.username}
                      refreshKey={refreshKey}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      No hay perfil disponible
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
