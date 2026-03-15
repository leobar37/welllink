import { eq, and, inArray, desc, sql } from "drizzle-orm";
import { db } from "../../db";
import {
  purchaseOrder,
  type PurchaseOrder,
  type NewPurchaseOrder,
} from "../../db/schema/purchase-order";
import {
  purchaseOrderItem,
  type PurchaseOrderItem,
  type NewPurchaseOrderItem,
} from "../../db/schema/purchase-order-item";
import type { RequestContext } from "../../types/context";

export interface CreatePurchaseOrderInput {
  profileId: string;
  supplierId: string;
  orderNumber?: string;
  expectedDate?: Date;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number | string;
    notes?: string;
  }>;
}

export interface UpdatePurchaseOrderInput {
  supplierId?: string;
  orderNumber?: string;
  expectedDate?: Date;
  notes?: string;
  tax?: number | string;
}

export interface ReceiveItemInput {
  productId: string;
  quantity: number;
  location?: string;
  notes?: string;
}

export class PurchaseOrderRepository {
  /**
   * Create a new purchase order with items
   */
  async createWithItems(data: CreatePurchaseOrderInput) {
    // Calculate totals for each item and overall
    let total = 0;
    const itemsToInsert = data.items.map((item) => {
      const itemTotal = Number(item.unitPrice) * item.quantity;
      total += itemTotal;
      return {
        purchaseOrderId: undefined as unknown as string, // Will be set after PO creation
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: String(item.unitPrice),
        total: String(itemTotal),
        notes: item.notes,
        receivedQuantity: 0,
      };
    });

    // Create the purchase order
    const [po] = await db
      .insert(purchaseOrder)
      .values({
        profileId: data.profileId,
        supplierId: data.supplierId,
        orderNumber: data.orderNumber,
        expectedDate: data.expectedDate,
        notes: data.notes,
        status: "draft",
        total: String(total),
        tax: "0",
      })
      .returning();

    // Update items with PO ID and insert
    const itemsWithPOId = itemsToInsert.map((item) => ({
      ...item,
      purchaseOrderId: po.id,
    }));

    const items = await db
      .insert(purchaseOrderItem)
      .values(itemsWithPOId as any)
      .returning();

    return { purchaseOrder: po, items };
  }

  /**
   * Find purchase order by ID
   */
  async findById(ctx: RequestContext, id: string) {
    return db.query.purchaseOrder.findFirst({
      where: eq(purchaseOrder.id, id),
      with: {
        items: true,
      },
    });
  }

  /**
   * Find purchase order by ID and profile directly
   */
  async findByIdAndProfile(id: string, profileId: string) {
    return db.query.purchaseOrder.findFirst({
      where: and(
        eq(purchaseOrder.id, id),
        eq(purchaseOrder.profileId, profileId)
      ),
      with: {
        items: true,
      },
    });
  }

  /**
   * Find all purchase orders for a profile
   */
  async findByProfileId(
    profileId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: string;
      supplierId?: string;
    }
  ) {
    const conditions = [eq(purchaseOrder.profileId, profileId)];

    if (options?.status) {
      conditions.push(eq(purchaseOrder.status, options.status as any));
    }

    if (options?.supplierId) {
      conditions.push(eq(purchaseOrder.supplierId, options.supplierId));
    }

    return db.query.purchaseOrder.findMany({
      where: and(...conditions),
      orderBy: desc(purchaseOrder.createdAt),
      limit: options?.limit,
      offset: options?.offset,
      with: {
        items: true,
      },
    });
  }

  /**
   * Find purchase order item by ID
   */
  async findItemById(id: string) {
    return db.query.purchaseOrderItem.findFirst({
      where: eq(purchaseOrderItem.id, id),
    });
  }

  /**
   * Find items for a purchase order
   */
  async findItemsByOrderId(orderId: string) {
    return db.query.purchaseOrderItem.findMany({
      where: eq(purchaseOrderItem.purchaseOrderId, orderId),
    });
  }

  /**
   * Update a purchase order
   */
  async update(id: string, profileId: string, data: UpdatePurchaseOrderInput) {
    // Convert tax to string if it's a number
    const updateData = {
      ...data,
      tax: data.tax !== undefined ? String(data.tax) : undefined,
    };
    
    const [result] = await db
      .update(purchaseOrder)
      .set({ ...updateData, updatedAt: new Date() })
      .where(
        and(eq(purchaseOrder.id, id), eq(purchaseOrder.profileId, profileId))
      )
      .returning();
    return result;
  }

  /**
   * Update purchase order status
   */
  async updateStatus(
    id: string,
    profileId: string,
    status: "draft" | "sent" | "partial" | "received" | "cancelled",
    additionalFields?: {
      sentAt?: Date;
      receivedAt?: Date;
      cancelledReason?: string;
    }
  ) {
    const [result] = await db
      .update(purchaseOrder)
      .set({
        status,
        ...additionalFields,
        updatedAt: new Date(),
      })
      .where(
        and(eq(purchaseOrder.id, id), eq(purchaseOrder.profileId, profileId))
      )
      .returning();
    return result;
  }

  /**
   * Update a purchase order item
   */
  async updateItem(id: string, data: Partial<NewPurchaseOrderItem>) {
    const [result] = await db
      .update(purchaseOrderItem)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(purchaseOrderItem.id, id))
      .returning();
    return result;
  }

  /**
   * Update item received quantity
   */
  async updateItemReceivedQuantity(
    id: string,
    receivedQuantity: number
  ) {
    const [result] = await db
      .update(purchaseOrderItem)
      .set({
        receivedQuantity,
        updatedAt: new Date(),
      })
      .where(eq(purchaseOrderItem.id, id))
      .returning();
    return result;
  }

  /**
   * Update PO total (recalculate)
   */
  async recalculateTotal(id: string, profileId: string) {
    // Get sum of all items
    const items = await db
      .select({ total: sql<string>`sum(${purchaseOrderItem.total})` })
      .from(purchaseOrderItem)
      .where(eq(purchaseOrderItem.purchaseOrderId, id));

    const newTotal = items[0]?.total || "0";

    const [result] = await db
      .update(purchaseOrder)
      .set({ total: newTotal, updatedAt: new Date() })
      .where(
        and(eq(purchaseOrder.id, id), eq(purchaseOrder.profileId, profileId))
      )
      .returning();

    return result;
  }

  /**
   * Delete a purchase order (only if draft)
   */
  async delete(id: string, profileId: string) {
    // First delete all items
    await db
      .delete(purchaseOrderItem)
      .where(eq(purchaseOrderItem.purchaseOrderId, id));

    // Then delete the PO
    const [result] = await db
      .delete(purchaseOrder)
      .where(
        and(
          eq(purchaseOrder.id, id),
          eq(purchaseOrder.profileId, profileId),
          eq(purchaseOrder.status, "draft")
        )
      )
      .returning();

    return result;
  }

  /**
   * Count purchase orders for a profile
   */
  async count(
    profileId: string,
    options?: {
      status?: string;
      supplierId?: string;
    }
  ) {
    const conditions = [eq(purchaseOrder.profileId, profileId)];

    if (options?.status) {
      conditions.push(eq(purchaseOrder.status, options.status as any));
    }

    if (options?.supplierId) {
      conditions.push(eq(purchaseOrder.supplierId, options.supplierId));
    }

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(purchaseOrder)
      .where(and(...conditions));

    return result[0]?.count ?? 0;
  }
}
