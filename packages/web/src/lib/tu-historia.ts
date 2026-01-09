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

export const getAssetPublicUrl = (assetId?: string | null) => {
  if (!assetId) return null;
  // Return a data URL that will trigger the component to fetch the actual URL
  return `asset://${assetId}`;
};

export async function trackStoryEvent(payload: TrackStoryEventPayload) {
  try {
    await api.stories.events.post(payload);
  } catch (error) {
    console.warn("No se pudo registrar el evento de historia", error);
  }
}
