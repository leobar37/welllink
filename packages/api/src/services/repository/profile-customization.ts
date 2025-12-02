import { eq } from "drizzle-orm";
import { db } from "../../db";
import {
  profileCustomization,
  type ProfileCustomization,
  type NewProfileCustomization,
} from "../../db/schema/profile-customization";

export class ProfileCustomizationRepository {
  async findByProfileId(profileId: string): Promise<ProfileCustomization | undefined> {
    return db.query.profileCustomization.findFirst({
      where: eq(profileCustomization.profileId, profileId),
    });
  }

  async create(
    data: NewProfileCustomization
  ): Promise<ProfileCustomization> {
    const [customization] = await db
      .insert(profileCustomization)
      .values(data)
      .returning();

    return customization;
  }

  async update(
    profileId: string,
    data: Partial<Omit<NewProfileCustomization, "profileId">>
  ): Promise<ProfileCustomization | undefined> {
    const [customization] = await db
      .update(profileCustomization)
      .set(data)
      .where(eq(profileCustomization.profileId, profileId))
      .returning();

    return customization;
  }

  async upsert(
    profileId: string,
    data: Partial<Omit<NewProfileCustomization, "profileId">>
  ): Promise<ProfileCustomization> {
    const existing = await this.findByProfileId(profileId);

    if (existing) {
      const updated = await this.update(profileId, data);
      return updated!;
    }

    return this.create({
      profileId,
      ...data,
    });
  }

  async updateTheme(
    profileId: string,
    themeId: string
  ): Promise<ProfileCustomization> {
    return this.upsert(profileId, { themeId });
  }

  async delete(profileId: string): Promise<ProfileCustomization | undefined> {
    const [customization] = await db
      .delete(profileCustomization)
      .where(eq(profileCustomization.profileId, profileId))
      .returning();

    return customization;
  }
}
