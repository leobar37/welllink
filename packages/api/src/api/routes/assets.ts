import { Elysia } from "elysia";
import { z } from "zod";
import { servicesPlugin } from "../../plugins/services";
import { contextPlugin } from "../../plugins/context";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { BadRequestException } from "../../utils/http-exceptions";
import type { Asset } from "../../db/schema/asset";

const createAssetSchema = z.object({
  storagePath: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  size: z.number().min(0),
});

const updateAssetSchema = z.object({
  filename: z.string().min(1).optional(),
  mimeType: z.string().min(1).optional(),
  size: z.number().min(0).optional(),
});

export const assetRoutes = new Elysia({ prefix: "/assets" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  // Ruta pública para servir assets (ej: avatares en perfiles públicos)
  .get("/:id/public", async ({ params, services, set }) => {
    // Usar el repository directamente para evitar validación de userId
    const asset = await services.assetRepository.findById(params.id);

    if (!asset) {
      set.status = 404;
      return { error: "Asset not found" };
    }

    try {
      const blob = await services.storage.download(asset.path);
      const buffer = await blob.arrayBuffer();

      set.headers["Content-Type"] = asset.mimeType;
      set.headers["Content-Disposition"] =
        `inline; filename="${asset.filename}"`;
      set.headers["Cache-Control"] = "public, max-age=31536000"; // Cache por 1 año

      return Buffer.from(buffer);
    } catch (error) {
      set.status = 404;
      return { error: "Asset file not found in storage" };
    }
  })
  .use(authGuard)
  .get("/", async ({ ctx, services, query }) => {
    const userId = query.userId as string;
    const assets = await services.assetService.getAssets(ctx, userId);

    // Resolve URLs for all assets
    return assets.map((asset: Asset) => ({
      ...asset,
      url: services.storage.getPublicUrl(asset.path),
    }));
  })
  .get("/stats", async ({ ctx, services, query }) => {
    const userId = query.userId as string;
    return services.assetService.getAssetStats(ctx, userId);
  })
  .post("/", async ({ body, set, ctx, services }) => {
    const data = createAssetSchema.parse(body);
    const asset = await services.assetService.createAsset(ctx, data);
    set.status = 201;
    if (!asset) {
      throw new BadRequestException("Failed to create asset");
    }
    return {
      ...asset,
      url: services.storage.getPublicUrl(asset.path),
    };
  })
  .post("/upload", async ({ body, set, ctx, services }) => {
    // Handle file upload
    const file = body as File;
    const asset = await services.assetService.uploadFile(ctx, file);
    if (!asset) {
      throw new BadRequestException("Failed to upload file");
    }
    set.status = 201;
    return {
      ...asset,
      url: services.storage.getPublicUrl(asset.path),
    };
  })
  .get("/:id", async ({ params, ctx, services }) => {
    const asset = await services.assetService.getAsset(ctx, params.id);
    return {
      ...asset,
      url: services.storage.getPublicUrl(asset.path),
    };
  })
  .get("/:id/url", async ({ params, ctx, services }) => {
    const url = await services.assetService.getAssetUrl(ctx, params.id);
    return { url };
  })
  .get("/:id/signed-url", async ({ params, ctx, services, query }) => {
    const expiresIn = query.expiresIn
      ? parseInt(query.expiresIn as string)
      : 3600;
    const url = await services.assetService.getAssetSignedUrl(
      ctx,
      params.id,
      expiresIn,
    );
    return { url, expiresIn };
  })
  .get("/:id/file", async ({ params, ctx, services, set }) => {
    const fileData = await services.assetService.getAssetFile(ctx, params.id);

    set.headers["Content-Type"] = fileData.mimeType;
    set.headers["Content-Disposition"] =
      `inline; filename="${fileData.filename}"`;

    return fileData.buffer;
  })
  .put("/:id", async ({ params, body, ctx, services }) => {
    const data = updateAssetSchema.parse(body);
    const asset = await services.assetService.updateAsset(ctx, params.id, data);
    return {
      ...asset,
      url: asset ? services.storage.getPublicUrl(asset.path) : null,
    };
  })
  .delete("/:id", async ({ params, ctx, services, set }) => {
    await services.assetService.deleteAsset(ctx, params.id);
    set.status = 204;
  });
