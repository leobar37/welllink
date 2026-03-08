import { eq } from "drizzle-orm";
import { db } from "../../db";
import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { PurchaseOrderRepository, CreatePurchaseOrderInput, UpdatePurchaseOrderInput, ReceiveItemInput } from "../repository/purchase-order";
import { InventoryRepository } from "../repository/inventory";
import { ProductRepository } from "../repository/product";
import type { PurchaseOrder } from "../../db/schema/purchase-order";
import { purchaseOrderItem } from "../../db/schema/purchase-order-item";
import type { PurchaseOrderItem } from "../../db/schema/purchase-order-item";
import type { StockMovement } from "../../db/schema/stock-movement";
import type { RequestContext } from "../../types/context";
import type { PurchaseOrderStatus } from "../../db/schema/enums";

export interface CreatePurchaseOrderDTO {
  profileId: string;
  supplierId: string;
  orderNumber?: string;
  expectedDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number | string;
    notes?: string;
  }>;
}

export interface UpdatePurchaseOrderDTO {
  supplierId?: string;
  orderNumber?: string;
  expectedDate?: string;
  notes?: string;
  tax?: number | string;
}

export interface ReceivePurchaseOrderDTO {
  items: Array<{
    productId: string;
    quantity: number;
    location?: string;
    notes?: string;
  }>;
}

export interface PurchaseOrderWithItems extends PurchaseOrder {
  items: PurchaseOrderItem[];
}

export class PurchaseOrderService {
  constructor(
    private purchaseOrderRepository: PurchaseOrderRepository,
    private inventoryRepository: InventoryRepository,
    private productRepository: ProductRepository,
  ) {}

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(
    ctx: RequestContext,
    data: CreatePurchaseOrderDTO
  ): Promise<PurchaseOrderWithItems> {
    // Validate supplier exists and belongs to profile
    const supplier = await this.purchaseOrderRepository.findByIdAndProfile?.(
      data.supplierId,
      data.profileId
    );
    
    // Validate all products exist
    for (const item of data.items) {
      const product = await this.productRepository.findById(ctx, item.productId);
      if (!product) {
        throw new NotFoundException(`Producto no encontrado: ${item.productId}`);
      }
      if (product.profileId !== data.profileId) {
        throw new BadRequestException(
          `El producto ${product.name} no pertenece a este perfil`
        );
      }
    }

    // Validate all quantities are positive
    for (const item of data.items) {
      if (item.quantity <= 0) {
        throw new BadRequestException(
          `La cantidad debe ser mayor a 0 para el producto`
        );
      }
    }

    // Create the purchase order
    const result = await this.purchaseOrderRepository.createWithItems({
      profileId: data.profileId,
      supplierId: data.supplierId,
      orderNumber: data.orderNumber,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
      notes: data.notes,
      items: data.items,
    });

    return {
      ...result.purchaseOrder,
      items: result.items,
    };
  }

  /**
   * Get a purchase order by ID
   */
  async getPurchaseOrder(
    ctx: RequestContext,
    id: string,
    profileId: string
  ): Promise<PurchaseOrderWithItems | null> {
    const po = await this.purchaseOrderRepository.findByIdAndProfile(
      id,
      profileId
    );

    if (!po) {
      return null;
    }

    return po as PurchaseOrderWithItems;
  }

  /**
   * List purchase orders for a profile
   */
  async listPurchaseOrders(
    profileId: string,
    options?: {
      limit?: number;
      offset?: number;
      status?: PurchaseOrderStatus;
      supplierId?: string;
    }
  ): Promise<PurchaseOrderWithItems[]> {
    const orders = await this.purchaseOrderRepository.findByProfileId(
      profileId,
      options
    );

    return orders as PurchaseOrderWithItems[];
  }

  /**
   * Update a purchase order (only if draft)
   */
  async updatePurchaseOrder(
    ctx: RequestContext,
    id: string,
    profileId: string,
    data: UpdatePurchaseOrderDTO
  ): Promise<PurchaseOrder> {
    // Check if PO exists and is draft
    const existing = await this.purchaseOrderRepository.findByIdAndProfile(
      id,
      profileId
    );

    if (!existing) {
      throw new NotFoundException("Orden de compra no encontrada");
    }

    if (existing.status !== "draft") {
      throw new BadRequestException(
        "Solo se pueden modificar órdenes de compra en estado borrador"
      );
    }

    // Validate supplier if changed
    if (data.supplierId && data.supplierId !== existing.supplierId) {
      const supplier = await this.purchaseOrderRepository.findByIdAndProfile?.(
        data.supplierId,
        profileId
      );
    }

    // Update the PO
    return this.purchaseOrderRepository.update(id, profileId, {
      ...data,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
    });
  }

  /**
   * Send a purchase order (draft -> sent)
   */
  async sendPurchaseOrder(
    ctx: RequestContext,
    id: string,
    profileId: string
  ): Promise<PurchaseOrder> {
    const existing = await this.purchaseOrderRepository.findByIdAndProfile(
      id,
      profileId
    );

    if (!existing) {
      throw new NotFoundException("Orden de compra no encontrada");
    }

    if (existing.status !== "draft") {
      throw new BadRequestException(
        "Solo se pueden enviar órdenes de compra en estado borrador"
      );
    }

    // Check that order has items
    const items = await this.purchaseOrderRepository.findItemsByOrderId(id);
    if (items.length === 0) {
      throw new BadRequestException(
        "La orden de compra debe tener al menos un artículo"
      );
    }

    // Update status to sent
    return this.purchaseOrderRepository.updateStatus(id, profileId, "sent", {
      sentAt: new Date(),
    });
  }

  /**
   * Receive stock from a purchase order
   * Can be partial or full - updates inventory and creates stock movements
   */
  async receivePurchaseOrder(
    ctx: RequestContext,
    id: string,
    profileId: string,
    data: ReceivePurchaseOrderDTO
  ): Promise<{ purchaseOrder: PurchaseOrder; movements: StockMovement[] }> {
    const existing = await this.purchaseOrderRepository.findByIdAndProfile(
      id,
      profileId
    );

    if (!existing) {
      throw new NotFoundException("Orden de compra no encontrada");
    }

    // Can only receive if sent or partial
    if (existing.status !== "sent" && existing.status !== "partial") {
      throw new BadRequestException(
        "Solo se pueden recibir órdenes de compra enviadas o parcialmente recibidas"
      );
    }

    const currentItems = await this.purchaseOrderRepository.findItemsByOrderId(id);
    const movements: StockMovement[] = [];

    // Process each item in the receive request
    for (const receiveItem of data.items) {
      // Find the matching order item
      const orderItem = currentItems.find(
        (item) => item.productId === receiveItem.productId
      );

      if (!orderItem) {
        throw new BadRequestException(
          `El producto no está en esta orden de compra`
        );
      }

      // Calculate how much more we can receive
      const remainingToReceive = orderItem.quantity - orderItem.receivedQuantity;

      if (receiveItem.quantity > remainingToReceive) {
        throw new BadRequestException(
          `Cantidad maxima a recibir: ${remainingToReceive}. Ya se han recibido ${orderItem.receivedQuantity} de ${orderItem.quantity}`
        );
      }

      if (receiveItem.quantity <= 0) {
        throw new BadRequestException(
          "La cantidad a recibir debe ser mayor a 0"
        );
      }

      // Update the received quantity
      const newReceivedQuantity = orderItem.receivedQuantity + receiveItem.quantity;
      await this.purchaseOrderRepository.updateItemReceivedQuantity(
        orderItem.id,
        newReceivedQuantity
      );

      // Create stock movement (purchase)
      const location = receiveItem.location ?? "default";
      
      const movementResult = await this.inventoryRepository.adjustStockDirect(
        receiveItem.productId,
        profileId,
        receiveItem.quantity,
        "purchase",
        {
          location,
          userId: ctx.userId,
          notes: receiveItem.notes ?? `Recepcion de OC: ${existing.orderNumber || id}`,
          referenceType: "purchase_order",
          referenceId: id,
        }
      );

      if (movementResult.movement) {
        movements.push(movementResult.movement);
      }
    }

    // Check if all items are fully received
    const updatedItems = await this.purchaseOrderRepository.findItemsByOrderId(id);
    const allFullyReceived = updatedItems.every(
      (item) => item.receivedQuantity === item.quantity
    );
    const anyPartiallyReceived = updatedItems.some(
      (item) => item.receivedQuantity > 0 && item.receivedQuantity < item.quantity
    );

    // Update PO status
    let newStatus: PurchaseOrderStatus;
    if (allFullyReceived) {
      newStatus = "received";
    } else if (anyPartiallyReceived) {
      newStatus = "partial";
    } else {
      // This shouldn't happen if we received anything, but keep current status
      newStatus = existing.status;
    }

    const additionalFields: any = {};
    if (newStatus === "received") {
      additionalFields.receivedAt = new Date();
    }

    const updatedPO = await this.purchaseOrderRepository.updateStatus(
      id,
      profileId,
      newStatus,
      additionalFields
    );

    return { purchaseOrder: updatedPO, movements };
  }

  /**
   * Cancel a purchase order (only if draft or sent)
   */
  async cancelPurchaseOrder(
    ctx: RequestContext,
    id: string,
    profileId: string,
    reason: string
  ): Promise<PurchaseOrder> {
    const existing = await this.purchaseOrderRepository.findByIdAndProfile(
      id,
      profileId
    );

    if (!existing) {
      throw new NotFoundException("Orden de compra no encontrada");
    }

    // Can only cancel if draft or sent
    if (existing.status !== "draft" && existing.status !== "sent") {
      throw new BadRequestException(
        "Solo se pueden cancelar órdenes de compra en estado borrador o enviado"
      );
    }

    // Check if already partially received
    const items = await this.purchaseOrderRepository.findItemsByOrderId(id);
    const hasPartialReceive = items.some(
      (item) => item.receivedQuantity > 0
    );

    if (hasPartialReceive) {
      throw new BadRequestException(
        "No se puede cancelar una orden de compra que ya ha sido recibida parcialmente"
      );
    }

    return this.purchaseOrderRepository.updateStatus(
      id,
      profileId,
      "cancelled",
      { cancelledReason: reason }
    );
  }

  /**
   * Delete a purchase order (only if draft and has no received items)
   */
  async deletePurchaseOrder(
    ctx: RequestContext,
    id: string,
    profileId: string
  ): Promise<void> {
    const existing = await this.purchaseOrderRepository.findByIdAndProfile(
      id,
      profileId
    );

    if (!existing) {
      throw new NotFoundException("Orden de compra no encontrada");
    }

    if (existing.status !== "draft") {
      throw new BadRequestException(
        "Solo se pueden eliminar órdenes de compra en estado borrador"
      );
    }

    await this.purchaseOrderRepository.delete(id, profileId);
  }

  /**
   * Add items to a draft purchase order
   */
  async addItems(
    ctx: RequestContext,
    id: string,
    profileId: string,
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number | string;
      notes?: string;
    }>
  ): Promise<PurchaseOrderItem[]> {
    const existing = await this.purchaseOrderRepository.findByIdAndProfile(
      id,
      profileId
    );

    if (!existing) {
      throw new NotFoundException("Orden de compra no encontrada");
    }

    if (existing.status !== "draft") {
      throw new BadRequestException(
        "Solo se pueden agregar artículos a órdenes de compra en estado borrador"
      );
    }

    // Validate all products exist
    for (const item of items) {
      const product = await this.productRepository.findById(ctx, item.productId);
      if (!product) {
        throw new NotFoundException(`Producto no encontrado: ${item.productId}`);
      }
      if (product.profileId !== profileId) {
        throw new BadRequestException(
          `El producto no pertenece a este perfil`
        );
      }
    }

    // Create items
    const newItems = await Promise.all(
      items.map(async (item) => {
        const total = Number(item.unitPrice) * item.quantity;
        const [newItem] = await db
          .insert(purchaseOrderItem)
          .values({
            purchaseOrderId: id,
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: String(item.unitPrice),
            total: String(total),
            notes: item.notes,
            receivedQuantity: 0,
          })
          .returning();
        return newItem;
      })
    );

    // Recalculate total
    await this.purchaseOrderRepository.recalculateTotal(id, profileId);

    return newItems;
  }

  /**
   * Remove item from a draft purchase order
   */
  async removeItem(
    ctx: RequestContext,
    id: string,
    itemId: string,
    profileId: string
  ): Promise<void> {
    const existing = await this.purchaseOrderRepository.findByIdAndProfile(
      id,
      profileId
    );

    if (!existing) {
      throw new NotFoundException("Orden de compra no encontrada");
    }

    if (existing.status !== "draft") {
      throw new BadRequestException(
        "Solo se pueden eliminar artículos de órdenes de compra en estado borrador"
      );
    }

    // Verify item belongs to this PO
    const item = await this.purchaseOrderRepository.findItemById(itemId);
    if (!item || item.purchaseOrderId !== id) {
      throw new NotFoundException("Artículo no encontrado en esta orden de compra");
    }

    // Check if already partially received
    if (item.receivedQuantity > 0) {
      throw new BadRequestException(
        "No se puede eliminar un artículo que ya ha sido recibido"
      );
    }

    // Delete item
    await db
      .delete(purchaseOrderItem)
      .where(eq(purchaseOrderItem.id, itemId));

    // Recalculate total
    await this.purchaseOrderRepository.recalculateTotal(id, profileId);
  }
}
