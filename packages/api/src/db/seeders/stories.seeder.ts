import { createSeederContext } from "./helpers";
import { createdProfileIds } from "./profiles.seeder";
import { createdAssetIds } from "./assets.seeder";
import { SEED_USERS } from "./users.seeder";
import { StoryService } from "../../services/business/story";
import { StorySectionRepository } from "../../services/repository/story-section";
import { StoryRepository } from "../../services/repository/story";
import { StoryEventRepository } from "../../services/repository/story-event";
import { ProfileRepository } from "../../services/repository/profile";
import { AssetRepository } from "../../services/repository/asset";

const storySectionRepository = new StorySectionRepository();
const storyRepository = new StoryRepository();
const storyEventRepository = new StoryEventRepository();
const profileRepository = new ProfileRepository();
const assetRepository = new AssetRepository();

const storyService = new StoryService(
  storySectionRepository,
  storyRepository,
  storyEventRepository,
  profileRepository,
  assetRepository,
);

type StoryFixture = {
  key: string;
  title: string;
  type: "self" | "client";
  beforeAssetKey: string;
  afterAssetKey: string;
  text: string;
  isPublished?: boolean;
};

type StoryEventFixture = {
  eventType: "section_viewed" | "story_changed" | "text_opened" | "cta_clicked";
  storyKey?: string;
  count?: number;
  metadata?: Record<string, unknown>;
};

type ProfileFixture = {
  profileKey: "maria" | "carlos" | "ana";
  userIndex: number;
  section: {
    title?: string;
    intro?: string | null;
    ctaLabel?: string | null;
    ctaUrl?: string | null;
  };
  stories: StoryFixture[];
  events?: StoryEventFixture[];
};

const STORY_FIXTURES: ProfileFixture[] = [
  {
    profileKey: "maria",
    userIndex: 0,
    section: {
      title: "Transformaciones guiadas por hábitos",
      intro:
        "Historias cortas de cómo aplico nutrición consciente y rutinas sostenibles para crear resultados reales.",
      ctaLabel: "Escríbeme por WhatsApp",
      ctaUrl: "https://wa.me/51987654321?text=Quiero+mi+plan+de+hábitos",
    },
    stories: [
      {
        key: "mariaSelfJourney",
        title: "De estrés crónico a energía constante",
        type: "self",
        beforeAssetKey: "mariaStorySelfBefore",
        afterAssetKey: "mariaStorySelfAfter",
        text:
          "En 2020 trabajaba 10 horas sentada y dormía 5. Rediseñé mi alimentación con batch cooking vegetal, micro siestas y respiración nasal. Resultado: -6 cm de cintura y energía estable todo el día.",
        isPublished: true,
      },
      {
        key: "mariaClientLaura",
        title: "Laura — Digestión ligera en 8 semanas",
        type: "client",
        beforeAssetKey: "mariaStoryClientBefore",
        afterAssetKey: "mariaStoryClientAfter",
        text:
          "Laura llegó con inflamación diaria y antojos nocturnos. Ajustamos horarios, agregamos probióticos naturales y respiraciones antes de comer. En 2 meses bajó 4 kg y ahora entrena 3 veces por semana.",
        isPublished: true,
      },
    ],
    events: [
      { eventType: "section_viewed", count: 18, metadata: { device: "mobile" } },
      {
        eventType: "story_changed",
        storyKey: "mariaClientLaura",
        count: 6,
        metadata: { selector: "dot" },
      },
      {
        eventType: "text_opened",
        storyKey: "mariaSelfJourney",
        count: 4,
        metadata: { buttonLabel: "Ver texto" },
      },
      {
        eventType: "cta_clicked",
        count: 3,
        metadata: { label: "Escríbeme por WhatsApp" },
      },
    ],
  },
  {
    profileKey: "carlos",
    userIndex: 1,
    section: {
      title: "Resultados medibles",
      intro:
        "Mostramos avances físicos y funcionales combinando fuerza, movilidad y seguimiento semanal.",
      ctaLabel: "Reserva una sesión inicial",
      ctaUrl: "https://wa.me/51976543210?text=Quiero+entrenar+contigo",
    },
    stories: [
      {
        key: "carlosClientJavier",
        title: "Javier — 6 kg menos sin perder fuerza",
        type: "client",
        beforeAssetKey: "carlosStoryClientBefore",
        afterAssetKey: "carlosStoryClientAfter",
        text:
          "Plan híbrido: 2 días de fuerza + 2 HIIT bajos en impacto, con control de proteínas. Mantuvimos su RM de sentadilla y redujo grasa abdominal en 10 semanas.",
        isPublished: true,
      },
      {
        key: "carlosDraftRunner",
        title: "Lucía — Preparación para su 10K",
        type: "client",
        beforeAssetKey: "carlosStoryDraftBefore",
        afterAssetKey: "carlosStoryDraftAfter",
        text:
          "En proceso. Ajustando técnica de carrera y fuerza de glúteo medio para prevenir lesiones antes de su primera 10K.",
        isPublished: false,
      },
    ],
    events: [
      { eventType: "section_viewed", count: 11, metadata: { device: "desktop" } },
      {
        eventType: "story_changed",
        storyKey: "carlosClientJavier",
        count: 5,
        metadata: { selector: "thumbnail" },
      },
      {
        eventType: "cta_clicked",
        count: 2,
        metadata: { label: "Reserva una sesión inicial" },
      },
    ],
  },
];

export const createdStoryIds: Record<string, string> = {};

export async function seedStories() {
  console.log("📖 Seeding Tu Historia data...");

  for (const fixture of STORY_FIXTURES) {
    const profileId = createdProfileIds[fixture.profileKey];
    if (!profileId) {
      console.log(`  ⚠️  Profile ${fixture.profileKey} not found, skipping stories`);
      continue;
    }

    const user = SEED_USERS[fixture.userIndex];
    const ctx = createSeederContext(user.id);

    await storyService.upsertSection(ctx, profileId, fixture.section);

    const existingStories = await storyRepository.listByProfile(profileId);
    const existingByTitle = new Map(existingStories.map((storyItem) => [storyItem.title, storyItem]));

    for (const storyData of fixture.stories) {
      const beforeAssetId = createdAssetIds[storyData.beforeAssetKey];
      const afterAssetId = createdAssetIds[storyData.afterAssetKey];

      if (!beforeAssetId || !afterAssetId) {
        console.log(`  ⚠️  Missing assets for story ${storyData.key}, skipping`);
        continue;
      }

      const basePayload = {
        title: storyData.title,
        type: storyData.type,
        beforeAssetId,
        afterAssetId,
        text: storyData.text,
      };

      const existing = existingByTitle.get(storyData.title);

      if (existing) {
        await storyService.updateStory(ctx, existing.id, basePayload);

        if (
          typeof storyData.isPublished === "boolean" &&
          existing.isPublished !== storyData.isPublished
        ) {
          await storyService.togglePublish(ctx, existing.id, storyData.isPublished);
        }

        createdStoryIds[storyData.key] = existing.id;
        continue;
      }

      const created = await storyService.createStory(ctx, profileId, {
        ...basePayload,
        isPublished: storyData.isPublished ?? false,
      });
      createdStoryIds[storyData.key] = created.id;
    }

    if (fixture.events?.length) {
      for (const event of fixture.events) {
        const targetStoryId = event.storyKey ? createdStoryIds[event.storyKey] : undefined;
        const times = event.count ?? 1;

        for (let i = 0; i < times; i++) {
          await storyService.trackEvent({
            profileId,
            storyId: targetStoryId,
            eventType: event.eventType,
            metadata: event.metadata ?? { source: "seed" },
          });
        }
      }
    }
  }

  console.log("✅ Tu Historia data seeded successfully\n");
}
