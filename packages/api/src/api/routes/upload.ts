import { Elysia } from "elysia";
import { z } from "zod";
import { servicesPlugin } from "../../plugins/services";
import { contextPlugin } from "../../plugins/context";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import { BadRequestException } from "../../utils/http-exceptions";

const uploadFileSchema = z.object({
  file: z
    .custom<File>((val) => val instanceof File, {
      message: "Expected a File object",
    })
    .optional(),
  type: z.enum(["avatar", "cover", "document", "image"]),
  folder: z.string().optional().default("uploads"),
});

export const uploadRoutes = new Elysia({ prefix: "/upload" })
  .use(errorMiddleware)
  .use(contextPlugin)
  .use(servicesPlugin)
  .use(authGuard)
  .post("/", async ({ body, set, ctx, services, request }) => {
    const data = uploadFileSchema.parse(body);

    // Check if file exists in multipart form
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException("File size exceeds 10MB limit");
    }

    // Validate file type based on asset type
    const allowedTypes: Record<string, string[]> = {
      avatar: ["image/jpeg", "image/png", "image/webp"],
      cover: ["image/jpeg", "image/png", "image/webp"],
      image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      document: [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ],
    };

    const allowedTypesForType = allowedTypes[data.type];
    if (!allowedTypesForType || !allowedTypesForType.includes(file.type)) {
      throw new BadRequestException(
        `Invalid file type for ${data.type}. Allowed types: ${allowedTypesForType?.join(", ") || "none"}`,
      );
    }

    // Upload file
    const asset = await services.assetService.uploadFile(ctx!, file, data.type);
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
      type: asset.type,
      url,
    };
  })
  .post("/multiple", async ({ set, ctx, services, request }) => {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const type = (formData.get("type") as string) || "image";

    if (!files || files.length === 0) {
      throw new BadRequestException("No files provided");
    }

    const results: Array<{
      id: string;
      filename: string;
      mimeType: string;
      size: number | null;
      type: string | null;
      url: string;
    }> = [];
    const errors: Array<{ filename: string; error: string }> = [];

    for (const file of files) {
      try {
        const asset = await services.assetService.uploadFile(ctx!, file, type);
        if (!asset) {
          throw new Error("Failed to upload file");
        }
        const url = services.storage.getPublicUrl(asset.path);
        results.push({
          id: asset.id,
          filename: asset.filename,
          mimeType: asset.mimeType,
          size: asset.size,
          type: asset.type,
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
  })
  .delete("/:id", async ({ params, ctx, services, set }) => {
    await services.assetService.deleteAsset(ctx!, params.id);
    set.status = 204;
  });
