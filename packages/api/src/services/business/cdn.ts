import {
  NotFoundException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import { AssetRepository } from "../repository/asset";
import type { StorageStrategy } from "../storage";

export class CDNService {
  constructor(
    private assetRepository: AssetRepository,
    private storage: StorageStrategy
  ) {}

  async getAssetUrl(ctx: RequestContext, assetId: string) {
    const asset = await this.assetRepository.findOne(ctx, assetId);

    if (!asset) {
      throw new NotFoundException("Asset not found");
    }

    return this.storage.getPublicUrl(asset.path);
  }

  async generatePresignedUrl(
    ctx: RequestContext,
    assetId: string,
    expiresIn: number = 3600
  ) {
    const asset = await this.assetRepository.findOne(ctx, assetId);

    if (!asset) {
      throw new NotFoundException("Asset not found");
    }

    const signedUrl = await this.storage.getSignedUrl(asset.path, expiresIn);
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return {
      url: signedUrl,
      expiresAt,
    };
  }

  async getAssetMetadata(ctx: RequestContext, assetId: string) {
    const asset = await this.assetRepository.findOne(ctx, assetId);

    if (!asset) {
      throw new NotFoundException("Asset not found");
    }

    const publicUrl = this.storage.getPublicUrl(asset.path);

    if (asset.mimeType.startsWith("image/")) {
      const metadata = this.getImageMetadata(asset);
      return {
        ...asset,
        metadata,
        url: publicUrl,
      };
    }

    return {
      ...asset,
      url: publicUrl,
    };
  }

  async getBulkUrls(ctx: RequestContext, assetIds: string[]) {
    const results: Record<string, string | null> = {};

    for (const id of assetIds) {
      try {
        const asset = await this.assetRepository.findOne(ctx, id);
        results[id] = asset ? this.storage.getPublicUrl(asset.path) : null;
      } catch {
        results[id] = null;
      }
    }

    return results;
  }

  private getImageMetadata(asset: { mimeType: string; size: number | null }) {
    return {
      format: asset.mimeType.split("/")[1],
      hasAlpha: asset.mimeType === "image/png",
      size: asset.size,
    };
  }
}
