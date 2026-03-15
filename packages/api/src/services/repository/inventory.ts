import {
  eq,
  and,
  desc,
  inArray,
  sql,
  lt,
  gte,
  lte,
} from "drizzle-orm";
import { db } from "../../db";
import {
  inventoryItem,
  type InventoryItem,
  type NewInventoryItem,
} from "../../db/schema/inventory-item";
import {
  stockMovement,
  type StockMovement,
  type NewStockMovement,
} from "../../db/schema/stock-movement";
import { product, type Product } from "../../db/schema/product";
import { profile } from "../../db/schema/profile";
import type { RequestContext } from "../../types/context";
import type { StockMovementReason } from "../../db/schema/enums";

export class InventoryRepository {
  /**
   * Get inventory item by ID
   */
  async findItemById(ctx: RequestContext, id: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return null;
    }

    const profileIds = profiles.map((p) => p.id);

    return db.query.inventoryItem.findFirst({
      where: and(
        eq(inventoryItem.id, id),
        inArray(inventoryItem.profileId, profileIds)
      ),
      with: {
        product: true,
      },
    });
  }

  /**
   * Get inventory item by product ID
   */
  async findByProductId(ctx: RequestContext, productId: string, location?: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return null;
    }

    const profileIds = profiles.map((p) => p.id);
    const conditions = [
      eq(inventoryItem.productId, productId),
      inArray(inventoryItem.profileId, profileIds),
    ];

    if (location) {
      conditions.push(eq(inventoryItem.location, location));
    }

    return db.query.inventoryItem.findFirst({
      where: and(...conditions),
      with: {
        product: true,
      },
    });
  }

  /**
   * Find inventory item by product ID and profile directly (for AI tools)
   */
  async findByProductIdDirect(productId: string, profileId: string, location?: string) {
    const conditions = [
      eq(inventoryItem.productId, productId),
      eq(inventoryItem.profileId, profileId),
    ];

    if (location) {
      conditions.push(eq(inventoryItem.location, location));
    }

    return db.query.inventoryItem.findFirst({
      where: and(...conditions),
      with: {
        product: true,
      },
    });
  }

  /**
   * Get all inventory items for a profile
   */
  async findByProfileId(ctx: RequestContext, options?: {
    location?: string;
    limit?: number;
    offset?: number;
  }) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);
    const conditions = [inArray(inventoryItem.profileId, profileIds)];

    if (options?.location) {
      conditions.push(eq(inventoryItem.location, options.location));
    }

    return db.query.inventoryItem.findMany({
      where: and(...conditions),
      orderBy: desc(inventoryItem.updatedAt),
      limit: options?.limit,
      offset: options?.offset,
      with: {
        product: true,
      },
    });
  }

  /**
   * Get total stock for a product across all locations
   */
  async getStock(ctx: RequestContext, productId: string) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return 0;
    }

    const profileIds = profiles.map((p) => p.id);

    const result = await db
      .select({
        totalQuantity: sql<number>`COALESCE(SUM(${inventoryItem.quantity}), 0)`,
        totalReserved: sql<number>`COALESCE(SUM(${inventoryItem.reservedQuantity}), 0)`,
      })
      .from(inventoryItem)
      .where(
        and(
          eq(inventoryItem.productId, productId),
          inArray(inventoryItem.profileId, profileIds),
          eq(inventoryItem.isActive, true)
        )
      );

    return {
      totalQuantity: result[0]?.totalQuantity ?? 0,
      totalReserved: result[0]?.totalReserved ?? 0,
      availableQuantity: (result[0]?.totalQuantity ?? 0) - (result[0]?.totalReserved ?? 0),
    };
  }

  /**
   * Get stock by product ID and profile directly (for AI tools)
   */
  async getStockDirect(productId: string, profileId: string) {
    const result = await db
      .select({
        totalQuantity: sql<number>`COALESCE(SUM(${inventoryItem.quantity}), 0)`,
        totalReserved: sql<number>`COALESCE(SUM(${inventoryItem.reservedQuantity}), 0)`,
      })
      .from(inventoryItem)
      .where(
        and(
          eq(inventoryItem.productId, productId),
          eq(inventoryItem.profileId, profileId),
          eq(inventoryItem.isActive, true)
        )
      );

    return {
      totalQuantity: result[0]?.totalQuantity ?? 0,
      totalReserved: result[0]?.totalReserved ?? 0,
      availableQuantity: (result[0]?.totalQuantity ?? 0) - (result[0]?.totalReserved ?? 0),
    };
  }

  /**
   * Adjust stock quantity - creates movement record and updates inventory
   */
  async adjustStock(
    ctx: RequestContext,
    productId: string,
    quantityChange: number,
    reason: StockMovementReason,
    options?: {
      location?: string;
      userId?: string;
      notes?: string;
      referenceType?: string;
      referenceId?: string;
    }
  ) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      throw new Error("Profile not found");
    }

    const profileId = profiles[0].id;
    const location = options?.location ?? "default";

    // Get current inventory item or create if not exists
    let inventoryItemRecord = await db.query.inventoryItem.findFirst({
      where: and(
        eq(inventoryItem.productId, productId),
        eq(inventoryItem.profileId, profileId),
        eq(inventoryItem.location, location)
      ),
    });

    let quantityBefore = 0;
    let quantityAfter = 0;
    let inventoryItemId: string;

    if (!inventoryItemRecord) {
      // Create new inventory item with initial quantity
      const [newItem] = await db.insert(inventoryItem).values({
        profileId,
        productId,
        location,
        quantity: Math.max(0, quantityChange),
        reservedQuantity: 0,
      }).returning();
      
      inventoryItemId = newItem.id;
      quantityBefore = 0;
      quantityAfter = Math.max(0, quantityChange);
    } else {
      // Update existing inventory
      quantityBefore = inventoryItemRecord.quantity;
      quantityAfter = Math.max(0, quantityBefore + quantityChange);
      inventoryItemId = inventoryItemRecord.id;

      await db
        .update(inventoryItem)
        .set({
          quantity: quantityAfter,
          updatedAt: new Date(),
          ...(reason === "purchase" ? { lastRestockedAt: new Date() } : {}),
        })
        .where(eq(inventoryItem.id, inventoryItemId));
    }

    // Create stock movement record
    const [movement] = await db.insert(stockMovement).values({
      profileId,
      productId,
      inventoryItemId,
      userId: options?.userId,
      reason,
      quantity: quantityChange,
      quantityBefore,
      quantityAfter,
      location,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      notes: options?.notes,
    }).returning();

    // Return updated inventory item with movement
    const updatedItem = await db.query.inventoryItem.findFirst({
      where: eq(inventoryItem.id, inventoryItemId),
      with: {
        product: true,
      },
    });

    return {
      inventoryItem: updatedItem,
      movement,
    };
  }

  /**
   * Adjust stock by product ID and profile directly (for AI tools)
   */
  async adjustStockDirect(
    productId: string,
    profileId: string,
    quantityChange: number,
    reason: StockMovementReason,
    options?: {
      location?: string;
      userId?: string;
      notes?: string;
      referenceType?: string;
      referenceId?: string;
    }
  ) {
    const location = options?.location ?? "default";

    let inventoryItemRecord = await db.query.inventoryItem.findFirst({
      where: and(
        eq(inventoryItem.productId, productId),
        eq(inventoryItem.profileId, profileId),
        eq(inventoryItem.location, location)
      ),
    });

    let quantityBefore = 0;
    let quantityAfter = 0;
    let inventoryItemId: string;

    if (!inventoryItemRecord) {
      const [newItem] = await db.insert(inventoryItem).values({
        profileId,
        productId,
        location,
        quantity: Math.max(0, quantityChange),
        reservedQuantity: 0,
      }).returning();
      
      inventoryItemId = newItem.id;
      quantityBefore = 0;
      quantityAfter = Math.max(0, quantityChange);
    } else {
      quantityBefore = inventoryItemRecord.quantity;
      quantityAfter = Math.max(0, quantityBefore + quantityChange);
      inventoryItemId = inventoryItemRecord.id;

      await db
        .update(inventoryItem)
        .set({
          quantity: quantityAfter,
          updatedAt: new Date(),
          ...(reason === "purchase" ? { lastRestockedAt: new Date() } : {}),
        })
        .where(eq(inventoryItem.id, inventoryItemId));
    }

    const [movement] = await db.insert(stockMovement).values({
      profileId,
      productId,
      inventoryItemId,
      userId: options?.userId,
      reason,
      quantity: quantityChange,
      quantityBefore,
      quantityAfter,
      location,
      referenceType: options?.referenceType,
      referenceId: options?.referenceId,
      notes: options?.notes,
    }).returning();

    const updatedItem = await db.query.inventoryItem.findFirst({
      where: eq(inventoryItem.id, inventoryItemId),
      with: {
        product: true,
      },
    });

    return {
      inventoryItem: updatedItem,
      movement,
    };
  }

  /**
   * Get stock movements for a product
   */
  async getMovements(ctx: RequestContext, productId: string, options?: {
    limit?: number;
    offset?: number;
    reason?: StockMovementReason;
    startDate?: Date;
    endDate?: Date;
  }) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);
    const conditions = [
      eq(stockMovement.productId, productId),
      inArray(stockMovement.profileId, profileIds),
    ];

    if (options?.reason) {
      conditions.push(eq(stockMovement.reason, options.reason));
    }

    if (options?.startDate) {
      conditions.push(gte(stockMovement.createdAt, options.startDate));
    }

    if (options?.endDate) {
      conditions.push(lte(stockMovement.createdAt, options.endDate));
    }

    return db.query.stockMovement.findMany({
      where: and(...conditions),
      orderBy: desc(stockMovement.createdAt),
      limit: options?.limit,
      offset: options?.offset,
    });
  }

  /**
   * Get all stock movements for a profile
   */
  async getAllMovements(ctx: RequestContext, options?: {
    limit?: number;
    offset?: number;
    productId?: string;
    reason?: StockMovementReason;
    startDate?: Date;
    endDate?: Date;
  }) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);
    const conditions = [inArray(stockMovement.profileId, profileIds)];

    if (options?.productId) {
      conditions.push(eq(stockMovement.productId, options.productId));
    }

    if (options?.reason) {
      conditions.push(eq(stockMovement.reason, options.reason));
    }

    if (options?.startDate) {
      conditions.push(gte(stockMovement.createdAt, options.startDate));
    }

    if (options?.endDate) {
      conditions.push(lte(stockMovement.createdAt, options.endDate));
    }

    return db.query.stockMovement.findMany({
      where: and(...conditions),
      orderBy: desc(stockMovement.createdAt),
      limit: options?.limit,
      offset: options?.offset,
      with: {
        product: true,
      },
    });
  }

  /**
   * Get low stock items - products where quantity <= minStock
   */
  async getLowStockItems(ctx: RequestContext, options?: {
    location?: string;
    limit?: number;
    offset?: number;
  }) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return [];
    }

    const profileIds = profiles.map((p) => p.id);

    // Subquery to get products with their minStock
    const itemsWithMinStock = await db
      .select({
        id: inventoryItem.id,
        profileId: inventoryItem.profileId,
        productId: inventoryItem.productId,
        location: inventoryItem.location,
        quantity: inventoryItem.quantity,
        reservedQuantity: inventoryItem.reservedQuantity,
        isActive: inventoryItem.isActive,
        createdAt: inventoryItem.createdAt,
        updatedAt: inventoryItem.updatedAt,
        minStock: product.minStock,
      })
      .from(inventoryItem)
      .innerJoin(product, eq(inventoryItem.productId, product.id))
      .where(
        and(
          inArray(inventoryItem.profileId, profileIds),
          eq(inventoryItem.isActive, true),
          sql`${inventoryItem.quantity} <= ${product.minStock}`
        )
      );

    if (options?.location) {
      return itemsWithMinStock
        .filter((item) => item.location === options.location)
        .slice(options.offset ?? 0, (options.offset ?? 0) + (options.limit ?? 50));
    }

    return itemsWithMinStock.slice(
      options?.offset ?? 0,
      (options?.offset ?? 0) + (options?.limit ?? 50)
    );
  }

  /**
   * Get low stock items with product details (for AI tools)
   */
  async getLowStockItemsWithProduct(profileId: string, options?: {
    location?: string;
    limit?: number;
    offset?: number;
  }) {
    const itemsWithMinStock = await db
      .select({
        id: inventoryItem.id,
        profileId: inventoryItem.profileId,
        productId: inventoryItem.productId,
        location: inventoryItem.location,
        quantity: inventoryItem.quantity,
        reservedQuantity: inventoryItem.reservedQuantity,
        isActive: inventoryItem.isActive,
        createdAt: inventoryItem.createdAt,
        updatedAt: inventoryItem.updatedAt,
        minStock: product.minStock,
      })
      .from(inventoryItem)
      .innerJoin(product, eq(inventoryItem.productId, product.id))
      .where(
        and(
          eq(inventoryItem.profileId, profileId),
          eq(inventoryItem.isActive, true),
          sql`${inventoryItem.quantity} <= ${product.minStock}`
        )
      );

    // Get full product details
    const results = await Promise.all(
      itemsWithMinStock.map(async (item) => {
        const fullProduct = await db.query.product.findFirst({
          where: eq(product.id, item.productId),
        });
        return {
          ...item,
          product: fullProduct,
        };
      })
    );

    if (options?.location) {
      return results
        .filter((item) => item.location === options.location)
        .slice(options.offset ?? 0, (options.offset ?? 0) + (options?.limit ?? 50));
    }

    return results.slice(
      options?.offset ?? 0,
      (options?.offset ?? 0) + (options?.limit ?? 50)
    );
  }

  /**
   * Create or get inventory item for a product
   */
  async getOrCreateInventoryItem(
    profileId: string,
    productId: string,
    location: string = "default"
  ) {
    let item = await db.query.inventoryItem.findFirst({
      where: and(
        eq(inventoryItem.productId, productId),
        eq(inventoryItem.profileId, profileId),
        eq(inventoryItem.location, location)
      ),
    });

    if (!item) {
      const [newItem] = await db.insert(inventoryItem).values({
        profileId,
        productId,
        location,
        quantity: 0,
        reservedQuantity: 0,
      }).returning();
      return newItem;
    }

    return item;
  }

  /**
   * Calculate total inventory value for a profile
   */
  async getInventoryValue(ctx: RequestContext) {
    const profiles = await db.query.profile.findMany({
      where: eq(profile.userId, ctx.userId),
      columns: { id: true },
    });

    if (profiles.length === 0) {
      return {
        totalValue: 0,
        totalItems: 0,
        byCategory: [],
      };
    }

    const profileIds = profiles.map((p) => p.id);

    const result = await db
      .select({
        totalValue: sql<number>`COALESCE(SUM(${inventoryItem.quantity} * COALESCE(${inventoryItem.averageCost}, 0)), 0)`,
        totalItems: sql<number>`COALESCE(SUM(${inventoryItem.quantity}), 0)`,
      })
      .from(inventoryItem)
      .where(
        and(
          inArray(inventoryItem.profileId, profileIds),
          eq(inventoryItem.isActive, true)
        )
      );

    return {
      totalValue: result[0]?.totalValue ?? 0,
      totalItems: result[0]?.totalItems ?? 0,
      byCategory: [], // Would need category join for detailed breakdown
    };
  }
}
