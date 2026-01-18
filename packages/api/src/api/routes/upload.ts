import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { contextPlugin } from "../../plugins/context";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { BadRequestException } from "../../utils/http-exceptions";

export const uploadRoutes = new Elysia({ prefix: "/upload" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  .post(
    "/",
    async ({ body, set, ctx, services }) => {
      const { file } = body;

      if (!file) {
        throw new BadRequestException("No file provided");
      }

      // Validate file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        throw new BadRequestException("File size exceeds 50MB limit");
      }

      // Validate file type - only allow images, videos, and PDFs
      const allowedMimeTypes = [
        // Images
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        // Videos
        "video/mp4",
        "video/webm",
        "video/quicktime",
        // PDF
        "application/pdf",
      ];

      if (!allowedMimeTypes.includes(file.type)) {
        throw new BadRequestException(
          `Invalid file type. Allowed: images (JPEG, PNG, GIF, WebP), videos (MP4, WebM, QuickTime), and PDF`,
        );
      }

      // Upload file
      const asset = await services.assetService.uploadFile(ctx, file);
      if (!asset) {
        throw new BadRequestException("Failed to upload file");
      }
      const url = services.storage.getPublicUrl(asset.path);

      set.status = 201;
      return {
        id: asset.id,
        filename: asset.filename,
        mimeType: asset.mimeType,
        size: asset.size,
        url,
      };
    },
    {
      body: t.Object({
        file: t.File(),
        folder: t.Optional(t.String({ default: "uploads" })),
      }),
    },
  )
  .post(
    "/multiple",
    async ({ set, ctx, services, body }) => {
      const { files } = body;

      if (!files || files.length === 0) {
        throw new BadRequestException("No files provided");
      }

      const results: Array<{
        id: string;
        filename: string;
        mimeType: string;
        size: number | null;
        url: string;
      }> = [];
      const errors: Array<{ filename: string; error: string }> = [];

      for (const file of files) {
        try {
          const asset = await services.assetService.uploadFile(ctx, file);
          if (!asset) {
            throw new Error("Failed to upload file");
          }
          const url = services.storage.getPublicUrl(asset.path);
          results.push({
            id: asset.id,
            filename: asset.filename,
            mimeType: asset.mimeType,
            size: asset.size,
            url,
          });
        } catch (error: unknown) {
          const message =
            error instanceof Error ? error.message : "Unknown error";
          errors.push({
            filename: file.name,
            error: message,
          });
        }
      }

      set.status = 207; // Multi-Status
      return {
        uploaded: results,
        errors,
        summary: {
          total: files.length,
          successful: results.length,
          failed: errors.length,
        },
      };
    },
    {
      body: t.Object({
        files: t.Files(),
      }),
    },
  )
  .delete("/:id", async ({ params, ctx, services, set }) => {
    await services.assetService.deleteAsset(ctx, params.id);
    set.status = 204;
  });
