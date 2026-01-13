/**
 * Social link URL generator utilities
 * Converts usernames/handles to platform-specific URLs
 */

import type { SocialPlatform } from "../types/dto";

export interface SocialLinkWithUrl {
  platform: SocialPlatform;
  username: string;
  url: string;
}

/**
 * Validate username format based on platform
 * @param platform - Social media platform
 * @param username - Username/handle/phone to validate
 * @throws BadRequestException if username is invalid for the platform
 */
export function validateUsernameByPlatform(
  platform: SocialPlatform,
  username: string
): void {
  const trimmed = username.trim();

  if (!trimmed) {
    throw new Error("Username cannot be empty");
  }

  switch (platform) {
    case "instagram":
      // Instagram: 1-30 characters, letters, numbers, periods, underscores
      if (!/^[a-zA-Z0-9._]{1,30}$/.test(trimmed)) {
        throw new Error(
          "Usuario de Instagram inválido. Debe tener 1-30 caracteres: letras, números, puntos y guiones bajos."
        );
      }
      break;

    case "tiktok":
      // TikTok: 1-24 characters, letters, numbers, underscores
      if (!/^[a-zA-Z0-9_]{1,24}$/.test(trimmed)) {
        throw new Error(
          "Usuario de TikTok inválido. Debe tener 1-24 caracteres: letras, números y guiones bajos."
        );
      }
      break;

    case "facebook":
      // Facebook: 5-50 characters, can include periods and hyphens
      if (!/^[a-zA-Z0-9.-]{5,50}$/.test(trimmed)) {
        throw new Error(
          "Usuario de Facebook inválido. Debe tener 5-50 caracteres."
        );
      }
      break;

    case "youtube":
      // YouTube handle: 3-30 characters, starts with @ (we'll add it automatically)
      if (!/^[a-zA-Z0-9_-]{3,30}$/.test(trimmed)) {
        throw new Error(
          "Handle de YouTube inválido. Debe tener 3-30 caracteres: letras, números, guiones y guiones bajos."
        );
      }
      break;

    case "whatsapp":
      // WhatsApp: Phone number with country code, only digits
      const digitsOnly = trimmed.replace(/\D/g, "");
      if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        throw new Error(
          "Número de WhatsApp inválido. Ingrese solo dígitos (incluyendo código de país)."
        );
      }
      break;

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Generate full URL from username and platform
 * @param platform - Social media platform
 * @param username - Username, handle, or phone number
 * @returns Full URL for the social media platform
 */
export function generateSocialUrl(
  platform: SocialPlatform,
  username: string
): string {
  // Clean the username (remove @ if present, trim whitespace)
  const cleanUsername = username.trim().replace(/^@/, "");

  switch (platform) {
    case "instagram":
      return `https://instagram.com/${cleanUsername}`;

    case "tiktok":
      return `https://tiktok.com/@${cleanUsername}`;

    case "facebook":
      return `https://facebook.com/${cleanUsername}`;

    case "youtube":
      return `https://youtube.com/@${cleanUsername}`;

    case "whatsapp":
      // For WhatsApp, username should be a phone number
      // Clean phone number: remove non-digit characters
      const cleanPhone = cleanUsername.replace(/\D/g, "");
      return `https://wa.me/${cleanPhone}`;

    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Transform an array of social links (with username) to include generated URLs
 * @param links - Array of social links with username
 * @returns Array of social links with generated URLs
 */
export function transformSocialLinksWithUrl<T extends { platform: SocialPlatform; username: string }>(
  links: T[]
): (T & { url: string })[] {
  return links.map((link) => ({
    ...link,
    url: generateSocialUrl(link.platform, link.username),
  }));
}

/**
 * Extract username from a full URL (for backward compatibility)
 * @param url - Full social media URL
 * @param platform - Platform type
 * @returns Extracted username/handle/phone number
 */
export function extractUsernameFromUrl(
  url: string,
  platform: SocialPlatform
): string | null {
  try {
    const urlObj = new URL(url);

    switch (platform) {
      case "instagram":
        // Extract username from instagram.com/username
        const instagramPath = urlObj.pathname.replace(/^\//, "");
        if (instagramPath && !instagramPath.includes("/")) {
          return instagramPath;
        }
        break;

      case "tiktok":
        // Extract username from tiktok.com/@username
        const tiktokPath = urlObj.pathname.replace(/^\//, "");
        if (tiktokPath.startsWith("@")) {
          return tiktokPath.substring(1);
        }
        break;

      case "facebook":
        // Extract username from facebook.com/username
        const fbPath = urlObj.pathname.replace(/^\//, "");
        if (fbPath && !fbPath.includes("/")) {
          return fbPath;
        }
        break;

      case "youtube":
        // Extract handle from youtube.com/@handle
        const ytPath = urlObj.pathname.replace(/^\//, "");
        if (ytPath.startsWith("@")) {
          return ytPath.substring(1);
        }
        break;

      case "whatsapp":
        // Extract phone number from wa.me/1234567890
        const waPath = urlObj.pathname.replace(/^\//, "");
        if (waPath) {
          return waPath;
        }
        break;
    }

    return null;
  } catch {
    return null;
  }
}
