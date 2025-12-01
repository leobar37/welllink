import { api } from "./api";

export type StoryEventType =
  | "section_viewed"
  | "story_changed"
  | "text_opened"
  | "cta_clicked";

export interface TrackStoryEventPayload {
  profileId: string;
  storyId?: string;
  eventType: StoryEventType;
  metadata?: Record<string, unknown>;
}

export const getAssetPublicUrl = (assetId?: string | null) =>
  assetId ? `/api/assets/${assetId}/public` : null;

export async function trackStoryEvent(payload: TrackStoryEventPayload) {
  try {
    await api.api.stories.events.post(payload);
  } catch (error) {
    console.warn("No se pudo registrar el evento de historia", error);
  }
}
