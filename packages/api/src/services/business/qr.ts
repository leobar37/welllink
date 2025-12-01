import QRCode from "qrcode";
import { NotFoundException } from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import { ProfileRepository } from "../repository/profile";

export type QRFormat = "png" | "svg";

export interface QRGenerationOptions {
  format?: QRFormat;
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface QRCodeResult {
  data: string | Buffer;
  format: QRFormat;
  mimeType: string;
  profileUrl: string;
}

export class QRService {
  private baseUrl: string;

  constructor(private profileRepository: ProfileRepository) {
    this.baseUrl = process.env.PUBLIC_URL || "https://wellnesslink.com";
  }

  /**
   * Generate a QR code for a profile
   */
  async generateQR(
    ctx: RequestContext,
    profileId: string,
    options: QRGenerationOptions = {},
  ): Promise<QRCodeResult> {
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const profileUrl = `${this.baseUrl}/${profile.username}`;
    const format = options.format || "png";
    const width = options.width || 300;
    const margin = options.margin || 2;
    const darkColor = options.color?.dark || "#000000";
    const lightColor = options.color?.light || "#ffffff";

    const qrOptions: QRCode.QRCodeToDataURLOptions &
      QRCode.QRCodeToStringOptions = {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    };

    let data: string;
    let mimeType: string;

    if (format === "svg") {
      data = await QRCode.toString(profileUrl, { ...qrOptions, type: "svg" });
      mimeType = "image/svg+xml";
    } else {
      data = await QRCode.toDataURL(profileUrl, qrOptions);
      mimeType = "image/png";
    }

    return {
      data,
      format,
      mimeType,
      profileUrl,
    };
  }

  /**
   * Generate QR code as a Buffer for download
   */
  async generateQRBuffer(
    ctx: RequestContext,
    profileId: string,
    options: QRGenerationOptions = {},
  ): Promise<{ buffer: Buffer; mimeType: string; filename: string }> {
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const profileUrl = `${this.baseUrl}/${profile.username}`;
    const format = options.format || "png";
    const width = options.width || 600; // Higher resolution for download
    const margin = options.margin || 2;
    const darkColor = options.color?.dark || "#000000";
    const lightColor = options.color?.light || "#ffffff";

    let buffer: Buffer;
    let mimeType: string;
    let filename: string;

    if (format === "svg") {
      const svg = await QRCode.toString(profileUrl, {
        type: "svg",
        width,
        margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });
      buffer = Buffer.from(svg, "utf-8");
      mimeType = "image/svg+xml";
      filename = `${profile.username}-qr.svg`;
    } else {
      buffer = await QRCode.toBuffer(profileUrl, {
        width,
        margin,
        color: {
          dark: darkColor,
          light: lightColor,
        },
      });
      mimeType = "image/png";
      filename = `${profile.username}-qr.png`;
    }

    return { buffer, mimeType, filename };
  }

  /**
   * Generate QR code by username (for public access)
   */
  async generateQRByUsername(
    username: string,
    options: QRGenerationOptions = {},
  ): Promise<QRCodeResult> {
    // Create a guest context for public access
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
    const format = options.format || "png";
    const width = options.width || 300;
    const margin = options.margin || 2;
    const darkColor = options.color?.dark || "#000000";
    const lightColor = options.color?.light || "#ffffff";

    const qrOptions = {
      width,
      margin,
      color: {
        dark: darkColor,
        light: lightColor,
      },
    };

    let data: string;
    let mimeType: string;

    if (format === "svg") {
      data = await QRCode.toString(profileUrl, { ...qrOptions, type: "svg" });
      mimeType = "image/svg+xml";
    } else {
      data = await QRCode.toDataURL(profileUrl, qrOptions);
      mimeType = "image/png";
    }

    return {
      data,
      format,
      mimeType,
      profileUrl,
    };
  }
}
