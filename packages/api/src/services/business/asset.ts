import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import type {
  CreateAssetData,
  CreateAssetWithPathData,
  UpdateAssetData,
} from "../../types/dto";
import { AssetRepository } from "../repository/asset";
import type { StorageStrategy } from "../storage";
import type { Asset } from "../../db/schema/asset";

export class AssetService {
  constructor(
    private assetRepository: AssetRepository,
    private storage: StorageStrategy,
  ) {}

  async getAssets(ctx: RequestContext, userId?: string) {
    return this.assetRepository.findByUser(ctx, userId);
  }

  async getAsset(ctx: RequestContext, id: string) {
    const asset = await this.assetRepository.findOne(ctx, id);
    if (!asset) {
      throw new NotFoundException("Asset not found");
    }
    return asset;
  }

  async createAsset(ctx: RequestContext, data: CreateAssetData) {
    // Validate required fields
    if (!data.storagePath || !data.mimeType) {
      throw new BadRequestException(
        "Missing required fields: storagePath, mimeType",
      );
    }

    // Check if file exists in storage
    const exists = await this.storage.exists(data.storagePath);
    if (!exists) {
      throw new BadRequestException(
        "File does not exist at the specified storage path",
      );
    }

    return this.assetRepository.create(ctx, {
      ...data,
      path: data.storagePath,
    });
  }

  async updateAsset(ctx: RequestContext, id: string, data: UpdateAssetData) {
    // Check if asset exists and user owns it
    const existingAsset = await this.assetRepository.findOne(ctx, id);
    if (!existingAsset) {
      throw new NotFoundException("Asset not found");
    }

    return this.assetRepository.update(ctx, id, data);
  }

  async deleteAsset(ctx: RequestContext, id: string) {
    // Check if asset exists and user owns it
    const asset = await this.assetRepository.findOne(ctx, id);
    if (!asset) {
      throw new NotFoundException("Asset not found");
    }

    // Delete file from storage
    try {
      await this.storage.delete(asset.path);
    } catch (error) {
      // File might not exist, but we still delete the database record
      console.warn("Failed to delete file from storage:", error);
    }

    return this.assetRepository.delete(ctx, id);
  }

  async uploadFile(ctx: RequestContext, file: File) {
    // Validate file
    if (!file) {
      throw new BadRequestException("No file provided");
    }

    // Upload to storage - use "assets" folder for all files
    const uploadResult = await this.storage.upload(ctx.userId, file, "asset");

    // Create asset record
    return this.assetRepository.create(ctx, {
      path: uploadResult.storagePath,
      filename: uploadResult.filename,
      mimeType: uploadResult.mimeType,
      size: uploadResult.size,
    });
  }

  async getAssetFile(ctx: RequestContext, id: string) {
    const asset = await this.assetRepository.findOne(ctx, id);
    if (!asset) {
      throw new NotFoundException("Asset not found");
    }

    try {
      const blob = await this.storage.download(asset.path);
      const buffer = await blob.arrayBuffer();
      return {
        buffer: Buffer.from(buffer),
        mimeType: asset.mimeType,
        filename: asset.filename,
      };
    } catch (error) {
      throw new NotFoundException("Asset file not found in storage");
    }
  }

  async getAssetUrl(ctx: RequestContext, id: string) {
    const asset = await this.assetRepository.findOne(ctx, id);
    if (!asset) {
      throw new NotFoundException("Asset not found");
    }

    return this.storage.getPublicUrl(asset.path);
  }

  async getAssetSignedUrl(ctx: RequestContext, id: string, expiresIn?: number) {
    const asset = await this.assetRepository.findOne(ctx, id);
    if (!asset) {
      throw new NotFoundException("Asset not found");
    }

    return this.storage.getSignedUrl(asset.path, expiresIn);
  }

  async createAssetIfNotExists(
    ctx: RequestContext,
    data: CreateAssetWithPathData,
  ) {
    return this.assetRepository.createIfNotExists(ctx, data);
  }

  async getAssetStats(ctx: RequestContext, userId?: string) {
    const assets = await this.assetRepository.findByUser(ctx, userId);

    // Simple stats without type classification
    return {
      totalAssets: assets.length,
      totalSize: assets.reduce(
        (sum: number, asset: Asset) => sum + (asset.size || 0),
        0,
      ),
    };
  }
}
