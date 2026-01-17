import { createSeederContext } from "./helpers";
import { CampaignTemplateRepository } from "../../services/repository/campaign-template";
import { CampaignRepository } from "../../services/repository/campaign";
import { createdProfileIds } from "./profiles.seeder";
import { getTestUserId } from "./users.seeder";
import { eq } from "drizzle-orm";
import { campaignTemplate, campaign } from "../schema";
import { CampaignStatus } from "../schema/campaign";
import { db } from "../index";

export const createdCampaignTemplateIds: Record<string, string> = {};
export const createdCampaignIds: Record<string, string> = {};

const CAMPAIGN_TEMPLATE_DATA = [
  {
    key: "template_promo",
    profileKey: "maria",
    name: "Promoción Taller Grupal",
    content:
      "Hola {{nombre}}, 👋\n\nTe invito a mi próximo taller de {TALLER}. Cupos limitados.\n\n{FECHA} | {HORA}\n\n¿Te anotas?",
    objective: "Promoción",
    variables: ["nombre", "TALLER", "FECHA", "HORA"],
    usageCount: 2,
  },
  {
    key: "template_followup",
    profileKey: "maria",
    name: "Seguimiento Post-Consulta",
    content:
      "Hola {{nombre}}, ¿cómo te va con el plan?\n\nRecuerda beber agua y mantener los horarios de comida.\n\n¡Ánimo!",
    objective: "Retención",
    variables: ["nombre"],
    usageCount: 5,
  },
  {
    key: "template_newsletter",
    profileKey: "maria",
    name: "Boletín Mensual - Tips de Nutrición",
    content:
      "Hola {{nombre}}, 🥗\n\nEste mes te comparto: {TIP_1} y {TIP_2}.\n\nPara más info, escríbeme.",
    objective: "Engagement",
    variables: ["nombre", "TIP_1", "TIP_2"],
    usageCount: 1,
  },
];

const CAMPAIGN_DATA = [
  {
    key: "campaign_promo_taller",
    profileKey: "maria",
    templateKey: "template_promo",
    name: "Promo Taller Alimentación Consciente",
    objective: "Promoción",
    messageContent:
      "Hola, 👋\n\nTe invito a mi próximo taller de Alimentación Consciente. Aprende batch cooking y planificación de comidas.\n\nSábado 15 de Feb | 10 AM\n\nCupos limitados. ¿Te anotas?",
    totalRecipients: 15,
    sentCount: 15,
    deliveredCount: 13,
    failedCount: 2,
    status: CampaignStatus.SENT,
    scheduledAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
  {
    key: "campaign_followup",
    profileKey: "maria",
    templateKey: "template_followup",
    name: "Seguimiento Semanal - Enero",
    objective: "Retención",
    messageContent:
      "Hola, ¿cómo te va con el plan nutricional?\n\nRecuerda:\n• 2L de agua diarios\n• 5 comidas al día\n• Cena ligere\n\n¡Estoy aquí para apoyarte!",
    totalRecipients: 8,
    sentCount: 8,
    deliveredCount: 8,
    failedCount: 0,
    status: CampaignStatus.SENT,
    scheduledAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    key: "campaign_draft",
    profileKey: "maria",
    templateKey: null,
    name: "Lanzamiento Programa Primavera",
    objective: "Ventas",
    messageContent:
      "Hola {{nombre}},\n\nEstoy lanzando mi nuevo Programa de Bienestar para Primavera.\n\nIncluye:\n• Evaluación inicial\n• 8 sesiones\n• Plan personalizado\n\nPrecio especial: $199 (antes $250)\n\n¡Escríbeme para reservar tu控除o!",
    totalRecipients: 0,
    sentCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    status: CampaignStatus.DRAFT,
    scheduledAt: null,
    sentAt: null,
  },
];

export async function seedCampaigns() {
  console.log("📢 Seeding campaigns...");

  const campaignTemplateRepository = new CampaignTemplateRepository();
  const campaignRepository = new CampaignRepository();
  const userId = await getTestUserId();

  console.log("  📝 Seeding campaign templates...");
  for (const templateData of CAMPAIGN_TEMPLATE_DATA) {
    const { key, profileKey, ...data } = templateData;
    const profileId = createdProfileIds[profileKey];
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(
        `  ⚠️  Profile ${profileKey} not found, skipping campaign template`,
      );
      continue;
    }

    const existingTemplate = await db.query.campaignTemplate.findFirst({
      where: eq(campaignTemplate.name, data.name),
    });

    if (existingTemplate) {
      createdCampaignTemplateIds[key] = existingTemplate.id;
      continue;
    }

    const created = await campaignTemplateRepository.create({
      ...data,
      profileId,
    });

    createdCampaignTemplateIds[key] = created.id;
    console.log(`    ✓ Created template: ${data.name}`);
  }

  console.log("  📢 Seeding campaigns...");
  for (const campaignData of CAMPAIGN_DATA) {
    const { key, profileKey, templateKey, ...data } = campaignData;
    const profileId = createdProfileIds[profileKey];
    const templateId = templateKey
      ? createdCampaignTemplateIds[templateKey]
      : null;
    const ctx = createSeederContext(userId);

    if (!profileId) {
      console.log(`  ⚠️  Profile ${profileKey} not found, skipping campaign`);
      continue;
    }

    const existingCampaign = await db.query.campaign.findFirst({
      where: eq(campaign.name, data.name),
    });

    if (existingCampaign) {
      createdCampaignIds[key] = existingCampaign.id;
      console.log(`    ✓ Campaign "${data.name}" already exists, skipping`);
      continue;
    }

    const created = await campaignRepository.create({
      ...data,
      profileId,
      templateId,
    });

    createdCampaignIds[key] = created.id;
    console.log(`    ✓ Created campaign: ${data.name} (${data.status})`);
  }

  console.log("✅ Campaigns seeded successfully\n");
}
