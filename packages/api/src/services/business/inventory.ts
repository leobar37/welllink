import {
  NotFoundException,
  BadRequestException,
} from "../../utils/http-exceptions";
import { InventoryRepository } from "../repository/inventory";
import { ProductRepository } from "../repository/product";
import type { InventoryItem, NewInventoryItem } from "../../db/schema/inventory-item";
import type { StockMovement } from "../../db/schema/stock-movement";
import type { RequestContext } from "../../types/context";
import type { StockMovementReason } from "../../db/schema/enums";

export interface AdjustStockInput {
  productId: string;
  quantity: number;
  reason: StockMovementReason;
  location?: string;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

export interface StockHistoryOptions {
  productId?: string;
  limit?: number;
  offset?: number;
  reason?: StockMovementReason;
  startDate?: Date;
  endDate?: Date;
}

export interface InventoryValue {
  totalValue: number;
  totalItems: number;
  byCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    value: number;
    itemCount: number;
  }>;
}

export interface LowStockItem {
  productId: string;
  productName: string;
  productSku: string;
  currentStock: number;
  minStock: number;
  location: string;
}

export class InventoryService {
  constructor(
    private inventoryRepository: InventoryRepository,
    private productRepository: ProductRepository,
  ) {}

  /**
   * Adjust stock quantity - creates movement record and updates inventory
   */
  async adjustStock(
    ctx: RequestContext,
    data: AdjustStockInput
  ): Promise<{ inventoryItem: InventoryItem; movement: StockMovement }> {
    const { productId, quantity, reason, location, notes, referenceType, referenceId } = data;

    // Validate product exists
    const product = await this.productRepository.findById(ctx, productId);
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    // Validate reason
    const validReasons: StockMovementReason[] = [
      "purchase",
      "sale",
      "return",
      "damage",
      "adjustment",
      "transfer",
      "initial",
      "service_consumption",
    ];
    if (!validReasons.includes(reason)) {
      throw new BadRequestException(`Razón de movimiento inválida: ${reason}`);
    }

    // Validate quantity
    if (quantity === 0) {
      throw new BadRequestException("La cantidad no puede ser 0");
    }

    // For negative adjustments, check if sufficient stock exists
    if (quantity < 0) {
      const stockResult = await this.inventoryRepository.getStock(ctx, productId);
      const stockInfo = typeof stockResult === 'number' 
        ? { totalQuantity: 0, totalReserved: 0, availableQuantity: 0 }
        : stockResult;
      
      if (stockInfo.availableQuantity < Math.abs(quantity)) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${stockInfo.availableQuantity}, solicitado: ${Math.abs(quantity)}`
        );
      }
    }

    // Perform the stock adjustment
    const result = await this.inventoryRepository.adjustStock(
      ctx,
      productId,
      quantity,
      reason,
      {
        location: location ?? "default",
        userId: ctx.userId,
        notes,
        referenceType,
        referenceId,
      }
    );

    // Cast to handle the undefined case
    return {
      inventoryItem: result.inventoryItem!,
      movement: result.movement,
    };
  }

  /**
   * Get stock for a specific product
   */
  async getStock(
    ctx: RequestContext,
    productId: string
  ): Promise<{
    totalQuantity: number;
    totalReserved: number;
    availableQuantity: number;
  }> {
    const product = await this.productRepository.findById(ctx, productId);
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    const stockResult = await this.inventoryRepository.getStock(ctx, productId);
    return typeof stockResult === 'number' 
      ? { totalQuantity: 0, totalReserved: 0, availableQuantity: 0 }
      : stockResult;
  }

  /**
   * Get stock history / movements
   */
  async getStockHistory(
    ctx: RequestContext,
    options: StockHistoryOptions
  ): Promise<StockMovement[]> {
    const { productId, limit, offset, reason, startDate, endDate } = options;

    // If productId provided, validate it exists
    if (productId) {
      const product = await this.productRepository.findById(ctx, productId);
      if (!product) {
        throw new NotFoundException("Producto no encontrado");
      }

      return this.inventoryRepository.getMovements(ctx, productId, {
        limit,
        offset,
        reason,
        startDate,
        endDate,
      });
    }

    // Get all movements for the profile
    return this.inventoryRepository.getAllMovements(ctx, {
      limit,
      offset,
      reason,
      startDate,
      endDate,
    });
  }

  /**
   * Check for low stock items
   */
  async checkLowStock(
    ctx: RequestContext,
    options?: {
      location?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<LowStockItem[]> {
    const lowStockItems = await this.inventoryRepository.getLowStockItems(ctx, options);

    const result: LowStockItem[] = await Promise.all(
      lowStockItems.map(async (item) => {
        const product = await this.productRepository.findById(ctx, item.productId);
        return {
          productId: item.productId,
          productName: product?.name ?? "Unknown",
          productSku: product?.sku ?? "Unknown",
          currentStock: item.quantity,
          minStock: item.minStock ?? 0,
          location: item.location,
        };
      })
    );

    return result;
  }

  /**
   * Get total inventory value
   */
  async getInventoryValue(ctx: RequestContext): Promise<InventoryValue> {
    const result = await this.inventoryRepository.getInventoryValue(ctx);

    return {
      totalValue: Number(result.totalValue) || 0,
      totalItems: Number(result.totalItems) || 0,
      byCategory: [], // Would need category aggregation
    };
  }

  /**
   * Get inventory item by product ID
   */
  async getInventoryItem(
    ctx: RequestContext,
    productId: string,
    location?: string
  ): Promise<InventoryItem | null> {
    const product = await this.productRepository.findById(ctx, productId);
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    const item = await this.inventoryRepository.findByProductId(ctx, productId, location);
    return item ?? null;
  }

  /**
   * Get all inventory items for a profile
   */
  async getAllInventoryItems(
    ctx: RequestContext,
    options?: {
      location?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<InventoryItem[]> {
    return this.inventoryRepository.findByProfileId(ctx, options);
  }

  /**
   * Reserve stock for an order/appointment
   */
  async reserveStock(
    ctx: RequestContext,
    productId: string,
    quantity: number,
    location?: string
  ): Promise<InventoryItem> {
    const product = await this.productRepository.findById(ctx, productId);
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    // Check available stock
    const stockResult = await this.inventoryRepository.getStock(ctx, productId);
    const stockInfo = typeof stockResult === 'number' 
      ? { totalQuantity: 0, totalReserved: 0, availableQuantity: 0 }
      : stockResult;
      
    if (stockInfo.availableQuantity < quantity) {
      throw new BadRequestException(
        `Stock insuficiente. Disponible: ${stockInfo.availableQuantity}, solicitado: ${quantity}`
      );
    }

    // Get current inventory item
    const inventoryItem = await this.inventoryRepository.findByProductId(
      ctx,
      productId,
      location ?? "default"
    );

    if (!inventoryItem) {
      throw new NotFoundException("Item de inventario no encontrado");
    }

    // Note: This would need a repository method to update reserved quantity
    // For now, we'll use adjustStock with a negative quantity
    await this.inventoryRepository.adjustStock(
      ctx,
      productId,
      -quantity,
      "sale",
      {
        location: location ?? "default",
        userId: ctx.userId,
        notes: `Reserva de stock: ${quantity} unidades`,
      }
    );

    return inventoryItem;
  }

  // Methods for AI tools - accept profileId directly without RequestContext

  /**
   * Get stock by product ID and profile (for AI tools)
   */
  async getStockDirect(
    productId: string,
    profileId: string
  ): Promise<{
    totalQuantity: number;
    totalReserved: number;
    availableQuantity: number;
  }> {
    return this.inventoryRepository.getStockDirect(productId, profileId);
  }

  /**
   * Adjust stock by product ID and profile directly (for AI tools)
   */
  async adjustStockDirect(
    productId: string,
    profileId: string,
    quantity: number,
    reason: StockMovementReason,
    options?: {
      location?: string;
      userId?: string;
      notes?: string;
      referenceType?: string;
      referenceId?: string;
    }
  ): Promise<{ inventoryItem: InventoryItem; movement: StockMovement }> {
    // Validate reason
    const validReasons: StockMovementReason[] = [
      "purchase",
      "sale",
      "return",
      "damage",
      "adjustment",
      "transfer",
      "initial",
      "service_consumption",
    ];
    if (!validReasons.includes(reason)) {
      throw new BadRequestException(`Razón de movimiento inválida: ${reason}`);
    }

    // For negative adjustments, check if sufficient stock exists
    if (quantity < 0) {
      const stockInfo = await this.inventoryRepository.getStockDirect(productId, profileId);
      if (stockInfo.availableQuantity < Math.abs(quantity)) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${stockInfo.availableQuantity}, solicitado: ${Math.abs(quantity)}`
        );
      }
    }

    const result = await this.inventoryRepository.adjustStockDirect(
      productId,
      profileId,
      quantity,
      reason,
      options
    );

    // Cast to handle the undefined case
    return {
      inventoryItem: result.inventoryItem!,
      movement: result.movement,
    };
  }

  /**
   * Get low stock items for a profile (for AI tools)
   */
  async getLowStockItemsForProfile(
    profileId: string,
    options?: {
      location?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<LowStockItem[]> {
    const lowStockItems = await this.inventoryRepository.getLowStockItemsWithProduct(
      profileId,
      options
    );

    const result: LowStockItem[] = lowStockItems.map((item) => ({
      productId: item.productId,
      productName: item.product?.name ?? "Unknown",
      productSku: item.product?.sku ?? "Unknown",
      currentStock: item.quantity,
      minStock: item.minStock ?? 0,
      location: item.location,
    }));

    return result;
  }

  /**
   * Get inventory value for a profile (for AI tools)
   */
  async getInventoryValueForProfile(profileId: string): Promise<InventoryValue> {
    // This would need a repository method that accepts profileId directly
    // For now, return empty value - would need to implement
    return {
      totalValue: 0,
      totalItems: 0,
      byCategory: [],
    };
  }
}
