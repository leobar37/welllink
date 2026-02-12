import { Elysia } from "elysia";
import { z } from "zod";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { QRService } from "../../services/business/qr";
import { CardService } from "../../services/business/card";
import { ProfileRepository } from "../../services/repository/profile";
import { AssetRepository } from "../../services/repository/asset";
import { SocialLinkRepository } from "../../services/repository/social-link";
import { AnalyticsRepository } from "../../services/repository/analytics";

const qrOptionsSchema = z.object({
  format: z.enum(["png", "svg"]).optional().default("png"),
  width: z.coerce.number().min(100).max(1000).optional().default(300),
  margin: z.coerce.number().min(0).max(10).optional().default(2),
  darkColor: z.string().optional().default("#000000"),
  lightColor: z.string().optional().default("#ffffff"),
});

const cardOptionsSchema = z.object({
  includeQR: z.coerce.boolean().optional().default(true),
  includeSocialLinks: z.coerce.boolean().optional().default(true),
  qrSize: z.coerce.number().min(50).max(300).optional().default(150),
});

export const qrRoutes = new Elysia({ prefix: "/qr" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .derive({ as: "global" }, ({ services }) => {
    const profileRepository = new ProfileRepository();
    const assetRepository = new AssetRepository();
    const socialLinkRepository = new SocialLinkRepository();
    const analyticsRepository = new AnalyticsRepository();
    const qrService = new QRService(profileRepository);
    const cardService = new CardService(
      profileRepository,
      assetRepository,
      socialLinkRepository,
      services.storage,
    );

    return {
      qrService,
      cardService,
      analyticsRepository,
    };
  })
  // Public routes - generate QR by username
  .get("/public/:username", async ({ params, query, qrService }) => {
    const options = qrOptionsSchema.parse(query);
    const result = await qrService.generateQRByUsername(params.username, {
      format: options.format,
      width: options.width,
      margin: options.margin,
      color: {
        dark: options.darkColor,
        light: options.lightColor,
      },
    });

    return {
      qrCode: result.data,
      format: result.format,
      mimeType: result.mimeType,
      profileUrl: result.profileUrl,
    };
  })
  // Public card data by username
  .get("/public/:username/card", async ({ params, query, cardService }) => {
    const options = cardOptionsSchema.parse(query);
    return cardService.generateCardDataByUsername(params.username, options);
  })
  // Protected routes
  .use(authGuard)
  // Generate QR for profile (returns data URL)
  .get("/profiles/:profileId", async ({ params, query, ctx, qrService }) => {
    const options = qrOptionsSchema.parse(query);
    const result = await qrService.generateQR(ctx!, params.profileId, {
      format: options.format,
      width: options.width,
      margin: options.margin,
      color: {
        dark: options.darkColor,
        light: options.lightColor,
      },
    });

    return {
      qrCode: result.data,
      format: result.format,
      mimeType: result.mimeType,
      profileUrl: result.profileUrl,
    };
  })
  // Download QR as file
  .get(
    "/profiles/:profileId/download",
    async ({ params, query, ctx, qrService, analyticsRepository, set }) => {
      const options = qrOptionsSchema.parse(query);
      const result = await qrService.generateQRBuffer(ctx!, params.profileId, {
        format: options.format,
        width: options.width || 600, // Higher resolution for download
        margin: options.margin,
        color: {
          dark: options.darkColor,
          light: options.lightColor,
        },
      });

      // Track QR download
      await analyticsRepository.createQRDownload({
        profileId: params.profileId,
        format: options.format,
      });

      set.headers["Content-Type"] = result.mimeType;
      set.headers["Content-Disposition"] =
        `attachment; filename="${result.filename}"`;

      return result.buffer;
    },
  )
  // Get card data for profile
  .get(
    "/profiles/:profileId/card",
    async ({ params, query, ctx, cardService }) => {
      const options = cardOptionsSchema.parse(query);
      return cardService.generateCardData(ctx!, params.profileId, options);
    },
  );
