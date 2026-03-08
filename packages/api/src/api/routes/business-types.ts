import { Elysia, t } from "elysia";
import { db } from "../../db";
import { businessType } from "../../db/schema/business-type";
import { eq } from "drizzle-orm";

export const businessTypeRoutes = new Elysia({ prefix: "/business-types" })
  // ========================================
  // BUSINESS TYPES
  // ========================================

  // Get all active business types (public endpoint)
  .get("", async () => {
    const types = await db.query.businessType.findMany({
      where: eq(businessType.isActive, true),
      orderBy: (bt, { asc }) => [asc(bt.name)],
    });
    return types;
  })

  // Get single business type by ID
  .get("/:id", async ({ params }) => {
    const type = await db.query.businessType.findFirst({
      where: eq(businessType.id, params.id),
    });

    if (!type) {
      throw new Error("Tipo de negocio no encontrado");
    }

    return type;
  });
