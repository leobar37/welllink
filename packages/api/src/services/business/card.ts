import QRCode from "qrcode";
import { NotFoundException } from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import { ProfileRepository } from "../repository/profile";
import { AssetRepository } from "../repository/asset";
import { SocialLinkRepository } from "../repository/social-link";
import type { StorageStrategy } from "../storage/storage.interface";
import { transformSocialLinksWithUrl } from "../../utils/social-links";

export interface VirtualCardData {
  profile: {
    username: string;
    displayName: string;
    title: string | null;
    bio: string | null;
    avatarUrl: string | null;
  };
  socialLinks: Array<{
    platform: string;
    url: string;
  }>;
  qrCodeDataUrl: string;
  profileUrl: string;
}

export interface CardGenerationOptions {
  includeQR?: boolean;
  includeSocialLinks?: boolean;
  qrSize?: number;
}

export class CardService {
  private baseUrl: string;

  constructor(
    private profileRepository: ProfileRepository,
    private assetRepository: AssetRepository,
    private socialLinkRepository: SocialLinkRepository,
    private storage: StorageStrategy,
  ) {
    this.baseUrl = process.env.PUBLIC_URL || "https://wellnesslink.com";
  }

  /**
   * Generate virtual card data for a profile
   * Returns structured data that can be used to render a card on the frontend
   */
  async generateCardData(
    ctx: RequestContext,
    profileId: string,
    options: CardGenerationOptions = {},
  ): Promise<VirtualCardData> {
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const profileUrl = `${this.baseUrl}/${profile.username}`;
    const includeQR = options.includeQR !== false;
    const includeSocialLinks = options.includeSocialLinks !== false;
    const qrSize = options.qrSize || 150;

    // Get avatar URL if exists
    let avatarUrl: string | null = null;
    if (profile.avatarId) {
      const asset = await this.assetRepository.findOne(ctx, profile.avatarId);
      if (asset) {
        avatarUrl = await this.storage.getPublicUrl(asset.path);
      }
    }

    // Get social links if requested
    let socialLinks: Array<{ platform: string; url: string }> = [];
    if (includeSocialLinks) {
      const links = await this.socialLinkRepository.findByProfile(
        ctx,
        profileId,
      );
      const linksWithUrl = transformSocialLinksWithUrl(links);
      socialLinks = linksWithUrl.map((link) => ({
        platform: link.platform,
        url: link.url,
      }));
    }

    // Generate QR code if requested
    let qrCodeDataUrl = "";
    if (includeQR) {
      qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
        width: qrSize,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    }

    return {
      profile: {
        username: profile.username,
        displayName: profile.displayName,
        title: profile.title,
        bio: profile.bio,
        avatarUrl,
      },
      socialLinks,
      qrCodeDataUrl,
      profileUrl,
    };
  }

  /**
   * Generate card data by username (for public access)
   */
  async generateCardDataByUsername(
    username: string,
    options: CardGenerationOptions = {},
  ): Promise<VirtualCardData> {
    const guestCtx: RequestContext = {
      userId: "",
      email: "",
      role: "guest",
    };

    const profile = await this.profileRepository.findByUsername(
      guestCtx,
      username,
    );
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const profileUrl = `${this.baseUrl}/${profile.username}`;
    const includeQR = options.includeQR !== false;
    const includeSocialLinks = options.includeSocialLinks !== false;
    const qrSize = options.qrSize || 150;

    // Get avatar URL if exists
    let avatarUrl: string | null = null;
    if (profile.avatarId) {
      const asset = await this.assetRepository.findOne(
        guestCtx,
        profile.avatarId,
      );
      if (asset) {
        avatarUrl = await this.storage.getPublicUrl(asset.path);
      }
    }

    // Get social links if requested
    let socialLinks: Array<{ platform: string; url: string }> = [];
    if (includeSocialLinks) {
      const links = await this.socialLinkRepository.findByProfile(
        guestCtx,
        profile.id,
      );
      // Transform social links with generated URLs
      socialLinks = links.map((link) => ({
        platform: link.platform,
        url: `${link.platform === "whatsapp" 
          ? `https://wa.me/${link.username.replace(/\D/g, "")}`
          : link.platform === "youtube"
          ? `https://youtube.com/@${link.username}`
          : link.platform === "tiktok"
          ? `https://tiktok.com/@${link.username}`
          : `https://${link.platform}.com/${link.username}`
        }`,
      }));
    }

    // Generate QR code if requested
    let qrCodeDataUrl = "";
    if (includeQR) {
      qrCodeDataUrl = await QRCode.toDataURL(profileUrl, {
        width: qrSize,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#ffffff",
        },
      });
    }

    return {
      profile: {
        username: profile.username,
        displayName: profile.displayName,
        title: profile.title,
        bio: profile.bio,
        avatarUrl,
      },
      socialLinks,
      qrCodeDataUrl,
      profileUrl,
    };
  }
}
