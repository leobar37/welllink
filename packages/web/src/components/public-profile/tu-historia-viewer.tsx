import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  TuHistoriaSection,
  TuHistoriaStory,
} from "@/lib/types";
import { getAssetPublicUrl, trackStoryEvent } from "@/lib/tu-historia";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  MousePointerClick,
} from "lucide-react";

interface TuHistoriaViewerProps {
  profileId: string;
  profileName: string;
  section: TuHistoriaSection;
  stories: TuHistoriaStory[];
  onBack?: () => void;
}

export function TuHistoriaViewer({
  profileId,
  profileName,
  section,
  stories,
  onBack,
}: TuHistoriaViewerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [showText, setShowText] = useState(false);

  const activeStory = stories[activeIndex];

  useEffect(() => {
    if (!profileId) return;
    trackStoryEvent({ profileId, eventType: "section_viewed" });
  }, [profileId]);

  const handleToggleText = () => {
    if (!activeStory) return;
    const next = !showText;
    setShowText(next);
    if (next) {
      trackStoryEvent({
        profileId,
        storyId: activeStory.id,
        eventType: "text_opened",
      });
    }
  };

  const handleCtaClick = () => {
    if (!section.ctaUrl) return;
    trackStoryEvent({ profileId, eventType: "cta_clicked" });
  };

  const handleSelectStory = (index: number) => {
    if (index === activeIndex) return;
    const nextStory = stories[index];
    if (nextStory) {
      trackStoryEvent({
        profileId,
        storyId: nextStory.id,
        eventType: "story_changed",
      });
    }
    setShowText(false);
    setSliderValue(50);
    setActiveIndex(index);
  };

  const beforeUrl = getAssetPublicUrl(activeStory?.beforeAssetId);
  const afterUrl = getAssetPublicUrl(activeStory?.afterAssetId);

  const ctaLabel = section.ctaLabel || "Contáctame";

  if (!stories.length) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
        <MousePointerClick className="h-10 w-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          El asesor aún no ha publicado historias.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-8">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <p className="text-sm text-muted-foreground">{profileName}</p>
            <h1 className="text-2xl font-semibold">{section.title}</h1>
          </div>
        </div>

        {section.intro && (
          <p className="text-base leading-relaxed text-muted-foreground">
            {section.intro}
          </p>
        )}

        {stories.length > 1 && (
          <div className="flex items-center justify-center gap-2">
            {stories.map((story, index) => (
              <button
                key={story.id}
                className={cn(
                  "h-2 w-8 rounded-full bg-muted transition",
                  index === activeIndex && "bg-primary",
                )}
                onClick={() => handleSelectStory(index)}
                aria-label={`Seleccionar historia ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative w-full overflow-hidden rounded-3xl bg-black/5 shadow">
            <div className="relative aspect-[3/4] w-full">
              {beforeUrl ? (
                <img
                  src={beforeUrl}
                  alt="Antes"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Imagen "antes" no disponible
                </div>
              )}
              {afterUrl && (
                <img
                  src={afterUrl}
                  alt="Después"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{
                    clipPath: `inset(0 ${100 - sliderValue}% 0 0)`,
                  }}
                />
              )}
              <div
                className="pointer-events-none absolute inset-y-0 w-[3px] -translate-x-1/2 bg-white shadow"
                style={{ left: `${sliderValue}%` }}
              />
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              <input
                type="range"
                min={0}
                max={100}
                value={sliderValue}
                onChange={(event) =>
                  setSliderValue(Number(event.target.value))
                }
                className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-muted"
              />
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {activeStory.type === "self"
                  ? "Historia personal"
                  : "Caso de cliente"}
              </Badge>
              {activeStory.isPublished ? (
                <Badge variant="secondary">Publicada</Badge>
              ) : (
                <Badge variant="destructive">Oculta</Badge>
              )}
            </div>
            <h2 className="text-xl font-semibold">{activeStory.title}</h2>
          </div>

          {activeStory.text && (
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={handleToggleText}
              >
                {showText ? (
                  <>
                    <EyeOff className="h-4 w-4" /> Ocultar texto
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" /> Ver texto
                  </>
                )}
              </Button>
              {showText && (
                <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
                  {activeStory.text}
                </p>
              )}
            </div>
          )}
        </div>

        {section.ctaUrl && (
          <Button
            className="w-full"
            size="lg"
            asChild
            onClick={handleCtaClick}
          >
            <a href={section.ctaUrl} target="_blank" rel="noreferrer">
              {ctaLabel}
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
