import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import type { RequestContext } from "../../types/context";
import { ProfileCustomizationRepository } from "../repository/profile-customization";
import { ProfileRepository } from "../repository/profile";
import {
  THEMES,
  DEFAULT_THEME_ID,
  getThemeById,
  isValidThemeId,
  type ThemeDefinition,
} from "../../config/themes";

export class ThemeService {
  constructor(
    private customizationRepository: ProfileCustomizationRepository,
    private profileRepository: ProfileRepository,
  ) {}

  /**
   * Get all available themes
   */
  getAvailableThemes(): ThemeDefinition[] {
    return THEMES;
  }

  /**
   * Get a specific theme by ID
   */
  getTheme(themeId: string): ThemeDefinition {
    const theme = getThemeById(themeId);
    if (!theme) {
      throw new NotFoundException("Theme not found");
    }
    return theme;
  }

  /**
   * Get the current theme for a profile
   */
  async getProfileTheme(
    ctx: RequestContext,
    profileId: string
  ): Promise<{ themeId: string; theme: ThemeDefinition }> {
    // Verify the user owns this profile
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const customization = await this.customizationRepository.findByProfileId(profileId);
    const themeId = customization?.themeId ?? DEFAULT_THEME_ID;
    const theme = getThemeById(themeId) ?? getThemeById(DEFAULT_THEME_ID)!;

    return { themeId, theme };
  }

  /**
   * Update the theme for a profile
   */
  async updateProfileTheme(
    ctx: RequestContext,
    profileId: string,
    themeId: string
  ): Promise<{ themeId: string; theme: ThemeDefinition }> {
    // Verify the user owns this profile
    const profile = await this.profileRepository.findOne(ctx, profileId);
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    // Validate theme ID
    if (!isValidThemeId(themeId)) {
      throw new BadRequestException(`Invalid theme ID: ${themeId}`);
    }

    // Update or create customization
    await this.customizationRepository.updateTheme(profileId, themeId);

    const theme = getThemeById(themeId)!;
    return { themeId, theme };
  }

  /**
   * Get theme for a public profile (no auth required)
   */
  async getPublicProfileTheme(
    profileId: string
  ): Promise<{ themeId: string; theme: ThemeDefinition }> {
    const customization = await this.customizationRepository.findByProfileId(profileId);
    const themeId = customization?.themeId ?? DEFAULT_THEME_ID;
    const theme = getThemeById(themeId) ?? getThemeById(DEFAULT_THEME_ID)!;

    return { themeId, theme };
  }
}
