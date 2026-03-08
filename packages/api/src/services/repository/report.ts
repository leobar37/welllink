import {
  eq,
  and,
  inArray,
  sql,
  desc,
  gte,
  lte,
  sum,
  avg,
  count,
} from "drizzle-orm";
import { db } from "../../db";
import {
  inventoryItem,
  type InventoryItem,
} from "../../db/schema/inventory-item";
import {
  stockMovement,
  type StockMovement,
} from "../../db/schema/stock-movement";
import { product, type Product } from "../../db/schema/product";
import { productCategory, type ProductCategory } from "../../db/schema/product-category";
import { profile } from "../../db/schema/profile";

export interface ReportFilters {
  startDate?: Date;
  endDate?: Date;
  categoryId?: string;
  location?: string;
}

export interface InventoryRotationItem {
  productId: string;
  productName: string;
  productSku: string;
  categoryName: string | null;
  totalConsumed: number;
  totalPurchased: number;
  averageInventory: number;
  rotationRate: number;
  cost: number;
}

export interface StockValuationItem {
  categoryId: string | null;
  categoryName: string | null;
  productCount: number;
  totalQuantity: number;
  totalValue: number;
}

export interface TopConsumedItem {
  productId: string;
  productName: string;
  productSku: string;
  categoryName: string | null;
  totalQuantity: number;
  totalValue: number;
}

export class ReportRepository {
  /**
   * Get inventory rotation report
   * Rotation Rate = Total Cost of Goods Sold / Average Inventory Value
   */
  async getInventoryRotation(
    profileId: string,
    filters?: ReportFilters
  ): Promise<InventoryRotationItem[]> {
    const conditions = [eq(inventoryItem.profileId, profileId)];

    // Get all active inventory items
    const inventoryItems = await db
      .select({
        id: inventoryItem.id,
        productId: inventoryItem.productId,
        quantity: inventoryItem.quantity,
        averageCost: inventoryItem.averageCost,
      })
      .from(inventoryItem)
      .where(and(...conditions, eq(inventoryItem.isActive, true)));

    if (inventoryItems.length === 0) {
      return [];
    }

    const productIds = inventoryItems.map((item) => item.productId);

    // Get product details
    const products = await db
      .select({
        id: product.id,
        name: product.name,
        sku: product.sku,
        cost: product.cost,
        categoryId: product.categoryId,
      })
      .from(product)
      .where(and(
        inArray(product.id, productIds),
        eq(product.isActive, true)
      ));

    // Build conditions for stock movements
    const movementConditions = [
      inArray(stockMovement.productId, productIds),
      eq(stockMovement.profileId, profileId),
    ];

    if (filters?.startDate) {
      movementConditions.push(gte(stockMovement.createdAt, filters.startDate));
    }

    if (filters?.endDate) {
      movementConditions.push(lte(stockMovement.createdAt, filters.endDate));
    }

    // Get stock movements for consumption (negative quantity changes)
    const consumedMovements = await db
      .select({
        productId: stockMovement.productId,
        totalConsumed: sql<number>`COALESCE(SUM(${stockMovement.quantity}), 0)`,
      })
      .from(stockMovement)
      .where(and(
        ...movementConditions,
        sql`${stockMovement.quantity} < 0`
      ))
      .groupBy(stockMovement.productId);

    // Get stock movements for purchases (positive quantity changes)
    const purchasedMovements = await db
      .select({
        productId: stockMovement.productId,
        totalPurchased: sql<number>`COALESCE(SUM(${stockMovement.quantity}), 0)`,
      })
      .from(stockMovement)
      .where(and(
        ...movementConditions,
        sql`${stockMovement.quantity} > 0`
      ))
      .groupBy(stockMovement.productId);

    // Get categories
    const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))];
    const categories = categoryIds.length > 0
      ? await db
          .select({
            id: productCategory.id,
            name: productCategory.name,
          })
          .from(productCategory)
          .where(inArray(productCategory.id, categoryIds as string[]))
      : [];

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Get average inventory from the period
    const avgInventoryConditions = [
      inArray(stockMovement.productId, productIds),
      eq(stockMovement.profileId, profileId),
    ];

    if (filters?.startDate) {
      avgInventoryConditions.push(gte(stockMovement.createdAt, filters.startDate));
    }

    if (filters?.endDate) {
      avgInventoryConditions.push(lte(stockMovement.createdAt, filters.endDate));
    }

    // Calculate average inventory from movements
    const avgInventoryData = await db
      .select({
        productId: stockMovement.productId,
        avgQuantity: sql<number>`AVG(${stockMovement.quantityAfter})`,
      })
      .from(stockMovement)
      .where(and(...avgInventoryConditions))
      .groupBy(stockMovement.productId);

    const avgInventoryMap = new Map(
      avgInventoryData.map((d) => [d.productId, Number(d.avgQuantity) || 0])
    );

    // Build consumption map
    const consumedMap = new Map(
      consumedMovements.map((m) => [m.productId, Math.abs(Number(m.totalConsumed))])
    );

    // Build purchased map
    const purchasedMap = new Map(
      purchasedMovements.map((m) => [m.productId, Number(m.totalPurchased)])
    );

    // Build result
    const result: InventoryRotationItem[] = [];

    for (const item of inventoryItems) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) continue;

      const totalConsumed = consumedMap.get(item.productId) || 0;
      const totalPurchased = purchasedMap.get(item.productId) || 0;
      const avgInventory = avgInventoryMap.get(item.productId) || item.quantity || 0;
      const cost = Number(prod.cost) || 0;

      // Rotation rate = COGS / Average Inventory
      const cogs = totalConsumed * cost;
      const averageInventoryValue = avgInventory * cost;
      const rotationRate = averageInventoryValue > 0
        ? Number((cogs / averageInventoryValue).toFixed(2))
        : 0;

      result.push({
        productId: item.productId,
        productName: prod.name,
        productSku: prod.sku,
        categoryName: prod.categoryId ? categoryMap.get(prod.categoryId) || null : null,
        totalConsumed,
        totalPurchased,
        averageInventory: avgInventory,
        rotationRate,
        cost,
      });
    }

    return result.sort((a, b) => b.rotationRate - a.rotationRate);
  }

  /**
   * Get stock valuation by category and total
   */
  async getStockValuation(
    profileId: string,
    filters?: ReportFilters
  ): Promise<{
    totalValue: number;
    totalItems: number;
    byCategory: StockValuationItem[];
  }> {
    const conditions = [
      eq(inventoryItem.profileId, profileId),
      eq(inventoryItem.isActive, true),
    ];

    if (filters?.categoryId) {
      // Need to join with product to filter by category
      const inventoryWithCategory = await db
        .select({
          id: inventoryItem.id,
          productId: inventoryItem.productId,
          quantity: inventoryItem.quantity,
          averageCost: inventoryItem.averageCost,
          categoryId: product.categoryId,
        })
        .from(inventoryItem)
        .innerJoin(product, eq(inventoryItem.productId, product.id))
        .where(and(...conditions, eq(product.categoryId, filters.categoryId)));

      const categoryData = await this.calculateCategoryValuation(
        profileId,
        filters.categoryId
      );

      const totalValue = inventoryWithCategory.reduce((sum, item) => {
        const cost = Number(item.averageCost) || 0;
        return sum + item.quantity * cost;
      }, 0);

      const totalItems = inventoryWithCategory.reduce((sum, item) => sum + item.quantity, 0);

      return {
        totalValue,
        totalItems,
        byCategory: categoryData,
      };
    }

    // Get all inventory items with product info
    const inventoryItems = await db
      .select({
        id: inventoryItem.id,
        productId: inventoryItem.productId,
        quantity: inventoryItem.quantity,
        averageCost: inventoryItem.averageCost,
        categoryId: product.categoryId,
      })
      .from(inventoryItem)
      .innerJoin(product, eq(inventoryItem.productId, product.id))
      .where(and(...conditions));

    // Get all categories
    const categories = await db
      .select({
        id: productCategory.id,
        name: productCategory.name,
      })
      .from(productCategory)
      .where(eq(productCategory.profileId, profileId));

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    // Group by category
    const categoryGroups = new Map<string | null, { quantity: number; value: number; count: number }>();

    let totalValue = 0;
    let totalItems = 0;

    for (const item of inventoryItems) {
      const cost = Number(item.averageCost) || 0;
      const value = item.quantity * cost;
      const categoryKey = item.categoryId || null;

      const existing = categoryGroups.get(categoryKey) || { quantity: 0, value: 0, count: 0 };
      categoryGroups.set(categoryKey, {
        quantity: existing.quantity + item.quantity,
        value: existing.value + value,
        count: existing.count + 1,
      });

      totalValue += value;
      totalItems += item.quantity;
    }

    const byCategory: StockValuationItem[] = [];

    for (const [categoryId, data] of categoryGroups) {
      byCategory.push({
        categoryId: categoryId as string | null,
        categoryName: categoryId ? categoryMap.get(categoryId) || null : "Sin categoría",
        productCount: data.count,
        totalQuantity: data.quantity,
        totalValue: data.value,
      });
    }

    // Sort by value descending
    byCategory.sort((a, b) => b.totalValue - a.totalValue);

    return {
      totalValue,
      totalItems,
      byCategory,
    };
  }

  private async calculateCategoryValuation(
    profileId: string,
    categoryId: string
  ): Promise<StockValuationItem[]> {
    const inventoryItems = await db
      .select({
        id: inventoryItem.id,
        productId: inventoryItem.productId,
        quantity: inventoryItem.quantity,
        averageCost: inventoryItem.averageCost,
      })
      .from(inventoryItem)
      .innerJoin(product, eq(inventoryItem.productId, product.id))
      .where(and(
        eq(inventoryItem.profileId, profileId),
        eq(inventoryItem.isActive, true),
        eq(product.categoryId, categoryId)
      ));

    const category = await db.query.productCategory.findFirst({
      where: eq(productCategory.id, categoryId),
    });

    const totalValue = inventoryItems.reduce((sum, item) => {
      const cost = Number(item.averageCost) || 0;
      return sum + item.quantity * cost;
    }, 0);

    const totalQuantity = inventoryItems.reduce((sum, item) => sum + item.quantity, 0);

    return [{
      categoryId,
      categoryName: category?.name || "Sin categoría",
      productCount: inventoryItems.length,
      totalQuantity,
      totalValue,
    }];
  }

  /**
   * Get top consumed products by quantity and value
   */
  async getTopConsumedProducts(
    profileId: string,
    filters?: ReportFilters,
    limit: number = 10
  ): Promise<TopConsumedItem[]> {
    const conditions = [
      eq(stockMovement.profileId, profileId),
      sql`${stockMovement.quantity} < 0`, // Only consumption (negative)
    ];

    if (filters?.startDate) {
      conditions.push(gte(stockMovement.createdAt, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(stockMovement.createdAt, filters.endDate));
    }

    // Get consumption by product
    const consumptionData = await db
      .select({
        productId: stockMovement.productId,
        totalQuantity: sql<number>`COALESCE(SUM(ABS(${stockMovement.quantity})), 0)`,
      })
      .from(stockMovement)
      .where(and(...conditions))
      .groupBy(stockMovement.productId)
      .orderBy(desc(sql`COALESCE(SUM(ABS(${stockMovement.quantity})), 0)`))
      .limit(limit);

    if (consumptionData.length === 0) {
      return [];
    }

    const productIds = consumptionData.map((c) => c.productId);

    // Get product details
    const products = await db
      .select({
        id: product.id,
        name: product.name,
        sku: product.sku,
        cost: product.cost,
        categoryId: product.categoryId,
      })
      .from(product)
      .where(and(
        inArray(product.id, productIds),
        eq(product.isActive, true)
      ));

    // Get categories
    const categoryIds = [...new Set(products.map((p) => p.categoryId).filter(Boolean))];
    const categories = categoryIds.length > 0
      ? await db
          .select({
            id: productCategory.id,
            name: productCategory.name,
          })
          .from(productCategory)
          .where(inArray(productCategory.id, categoryIds as string[]))
      : [];

    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Build result
    const result: TopConsumedItem[] = consumptionData.map((item) => {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return null;
      }

      const totalQuantity = Number(item.totalQuantity);
      const cost = Number(prod.cost) || 0;
      const totalValue = totalQuantity * cost;

      return {
        productId: item.productId,
        productName: prod.name,
        productSku: prod.sku,
        categoryName: prod.categoryId ? categoryMap.get(prod.categoryId) || null : null,
        totalQuantity,
        totalValue,
      };
    }).filter((item): item is TopConsumedItem => item !== null);

    // Sort by value
    result.sort((a, b) => b.totalValue - a.totalValue);

    return result.slice(0, limit);
  }
}
