import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "../../utils/http-exceptions";
import { ProductRepository } from "../repository/product";
import { InventoryRepository } from "../repository/inventory";
import type { Product, NewProduct } from "../../db/schema/product";
import type { InventoryItem } from "../../db/schema/inventory-item";
import type { RequestContext } from "../../types/context";
import type { StockMovementReason } from "../../db/schema/enums";

export interface CreateProductInput {
  profileId?: string;
  sku: string;
  name: string;
  description?: string;
  price: number;
  cost?: number;
  unit?: string;
  minStock?: number;
  categoryId?: string;
  supplierId?: string;
  barcode?: string;
  hasExpiration?: boolean;
  expirationDays?: number;
  brand?: string;
  notes?: string;
  initialStock?: number;
  location?: string;
}

export interface UpdateProductInput {
  sku?: string;
  name?: string;
  description?: string;
  price?: string | number;
  cost?: string | number;
  unit?: string;
  minStock?: number;
  categoryId?: string;
  supplierId?: string;
  barcode?: string;
  hasExpiration?: boolean;
  expirationDays?: number;
  brand?: string;
  notes?: string;
}

export interface SearchProductsQuery {
  searchTerm?: string;
  categoryId?: string;
  supplierId?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  profileId?: string;
}

export interface ProductWithInventory extends Product {
  inventory?: InventoryItem;
  totalStock?: number;
}

export class ProductService {
  constructor(
    private productRepository: ProductRepository,
    private inventoryRepository: InventoryRepository,
  ) {}

  /**
   * Create a new product with SKU uniqueness validation
   */
  async createProduct(ctx: RequestContext, data: CreateProductInput): Promise<ProductWithInventory> {
    // Validate required fields
    if (!data.sku) {
      throw new BadRequestException("SKU es requerido");
    }
    if (!data.name) {
      throw new BadRequestException("Nombre del producto es requerido");
    }
    if (!data.price) {
      throw new BadRequestException("Precio es requerido");
    }

    // Profile ID is required - either from input or derived
    if (!data.profileId) {
      throw new BadRequestException("ID de perfil es requerido");
    }

    // Check SKU uniqueness for this profile
    const existingProduct = await this.productRepository.findBySkuAndProfile(data.sku, data.profileId);
    if (existingProduct) {
      throw new ConflictException(`Ya existe un producto con SKU: ${data.sku}`);
    }

    // Create the product
    const newProduct = await this.productRepository.create({
      profileId: data.profileId,
      sku: data.sku,
      name: data.name,
      description: data.description,
      price: data.price.toString(),
      cost: data.cost?.toString(),
      unit: data.unit as NewProduct["unit"] || "piece",
      minStock: data.minStock ?? 0,
      categoryId: data.categoryId,
      supplierId: data.supplierId,
      barcode: data.barcode,
      hasExpiration: data.hasExpiration ?? false,
      expirationDays: data.expirationDays,
      brand: data.brand,
      notes: data.notes,
    });

    // If initial stock is provided, create inventory record
    let inventory: InventoryItem | undefined;
    if (data.initialStock !== undefined && data.initialStock > 0) {
      const result = await this.inventoryRepository.adjustStockDirect(
        newProduct.id,
        data.profileId,
        data.initialStock,
        "purchase" as StockMovementReason,
        {
          location: data.location ?? "default",
          userId: ctx.userId,
          notes: "Stock inicial al crear producto",
        }
      );
      inventory = result.inventoryItem;
    }

    // Get the product with inventory info
    const product = await this.productRepository.findByIdAndProfile(newProduct.id, data.profileId);
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    return {
      ...product,
      inventory,
    };
  }

  /**
   * Get product by ID
   */
  async getProduct(ctx: RequestContext, id: string, profileId: string): Promise<ProductWithInventory> {
    const product = await this.productRepository.findByIdAndProfile(id, profileId);
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    // Get inventory info
    const stockInfo = await this.inventoryRepository.getStockDirect(id, profileId);

    return {
      ...product,
      totalStock: stockInfo.totalQuantity,
    };
  }

  /**
   * Search products by name, SKU, or barcode
   */
  async searchProducts(ctx: RequestContext, query: SearchProductsQuery): Promise<ProductWithInventory[]> {
    if (!query.profileId) {
      throw new BadRequestException("ID de perfil es requerido");
    }

    let products: Product[];

    if (query.searchTerm) {
      // Search in profile-specific products
      products = await this.productRepository.findByProfileIdDirect(
        query.profileId,
        {
          limit: query.limit,
          offset: query.offset,
          categoryId: query.categoryId,
          isActive: query.isActive,
        }
      );
      // Filter by search term in memory since findByProfileIdDirect doesn't support search
      if (query.searchTerm) {
        const searchLower = query.searchTerm.toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.sku.toLowerCase().includes(searchLower) ||
          (p.barcode && p.barcode.toLowerCase().includes(searchLower))
        );
      }
    } else {
      products = await this.productRepository.findByProfileIdDirect(query.profileId, {
        limit: query.limit,
        offset: query.offset,
        categoryId: query.categoryId,
        isActive: query.isActive,
      });
    }

    // Get stock info for each product
    const productsWithStock = await Promise.all(
      products.map(async (product) => {
        const stockInfo = await this.inventoryRepository.getStockDirect(product.id, query.profileId!);
        return {
          ...product,
          totalStock: stockInfo.totalQuantity,
        } as ProductWithInventory;
      })
    );

    return productsWithStock;
  }

  /**
   * Update a product
   */
  async updateProduct(
    ctx: RequestContext,
    id: string,
    profileId: string,
    data: UpdateProductInput
  ): Promise<Product> {
    const existingProduct = await this.productRepository.findByIdAndProfile(id, profileId);
    if (!existingProduct) {
      throw new NotFoundException("Producto no encontrado");
    }

    // Check SKU uniqueness if SKU is being changed
    if (data.sku && data.sku !== existingProduct.sku) {
      const existingWithSku = await this.productRepository.findBySkuAndProfile(data.sku, profileId);
      if (existingWithSku) {
        throw new ConflictException(`Ya existe un producto con SKU: ${data.sku}`);
      }
    }

    // Convert price/cost to string if provided as number
    const updateData: Record<string, unknown> = { ...data };
    if (typeof data.price === 'number') {
      updateData.price = data.price.toString();
    }
    if (typeof data.cost === 'number') {
      updateData.cost = data.cost.toString();
    }

    return this.productRepository.updateByIdAndProfile(id, profileId, updateData as Parameters<typeof this.productRepository.updateByIdAndProfile>[2]);
  }

  /**
   * Delete a product (soft delete)
   */
  async deleteProduct(ctx: RequestContext, id: string, profileId: string): Promise<void> {
    const existingProduct = await this.productRepository.findByIdAndProfile(id, profileId);
    if (!existingProduct) {
      throw new NotFoundException("Producto no encontrado");
    }

    await this.productRepository.delete(ctx, id);
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(ctx: RequestContext, sku: string, profileId: string): Promise<ProductWithInventory | null> {
    const product = await this.productRepository.findBySkuAndProfile(sku, profileId);
    if (!product) {
      return null;
    }

    const stockInfo = await this.inventoryRepository.getStockDirect(product.id, profileId);

    return {
      ...product,
      totalStock: stockInfo.totalQuantity,
    };
  }

  /**
   * Get products with low stock
   */
  async getLowStockProducts(profileId: string, options?: {
    location?: string;
    limit?: number;
    offset?: number;
  }): Promise<ProductWithInventory[]> {
    const lowStockItems = await this.inventoryRepository.getLowStockItemsWithProduct(profileId, options);

    const products: ProductWithInventory[] = lowStockItems
      .filter((item) => item.product)
      .map((item) => ({
      ...item.product!,
      inventory: item,
      totalStock: item.quantity,
    } as unknown as ProductWithInventory));

    return products;
  }

  /**
   * Check if product has sufficient stock
   */
  async checkSufficientStock(
    productId: string,
    profileId: string,
    requiredQuantity: number,
    location?: string
  ): Promise<{ sufficient: boolean; available: number; required: number }> {
    const stockInfo = await this.inventoryRepository.getStockDirect(productId, profileId);
    const available = stockInfo.availableQuantity;

    return {
      sufficient: available >= requiredQuantity,
      available,
      required: requiredQuantity,
    };
  }

  // Methods for AI tools - accept profileId directly without RequestContext

  /**
   * Find product by ID and profile ID (for AI tools)
   */
  async findByIdAndProfile(productId: string, profileId: string): Promise<ProductWithInventory | null> {
    const product = await this.productRepository.findByIdAndProfile(productId, profileId);
    if (!product) {
      return null;
    }

    const stockInfo = await this.inventoryRepository.getStockDirect(productId, profileId);

    return {
      ...product,
      totalStock: stockInfo.totalQuantity,
    };
  }

  /**
   * Find product by SKU and profile ID (for AI tools)
   */
  async findBySkuAndProfile(sku: string, profileId: string): Promise<ProductWithInventory | null> {
    const product = await this.productRepository.findBySkuAndProfile(sku, profileId);
    if (!product) {
      return null;
    }

    const stockInfo = await this.inventoryRepository.getStockDirect(product.id, profileId);

    return {
      ...product,
      totalStock: stockInfo.totalQuantity,
    };
  }

  /**
   * Create product for profile (for AI tools)
   */
  async createForProfile(
    profileId: string,
    data: CreateProductInput & { userId?: string }
  ): Promise<Product> {
    if (!data.sku) {
      throw new BadRequestException("SKU es requerido");
    }
    if (!data.name) {
      throw new BadRequestException("Nombre del producto es requerido");
    }
    if (!data.price) {
      throw new BadRequestException("Precio es requerido");
    }

    // Check SKU uniqueness for this profile
    const existingProduct = await this.productRepository.findBySkuAndProfile(data.sku, profileId);
    if (existingProduct) {
      throw new ConflictException(`Ya existe un producto con SKU: ${data.sku}`);
    }

    return this.productRepository.create({
      profileId,
      sku: data.sku,
      name: data.name,
      description: data.description,
      price: data.price.toString(),
      cost: data.cost?.toString(),
      unit: data.unit as NewProduct["unit"] || "piece",
      minStock: data.minStock ?? 0,
      categoryId: data.categoryId,
      supplierId: data.supplierId,
      barcode: data.barcode,
      hasExpiration: data.hasExpiration ?? false,
      expirationDays: data.expirationDays,
      brand: data.brand,
      notes: data.notes,
    });
  }

  /**
   * Update product by ID and profile (for AI tools)
   */
  async updateByIdAndProfile(
    productId: string,
    profileId: string,
    data: UpdateProductInput
  ): Promise<Product> {
    const existingProduct = await this.productRepository.findByIdAndProfile(productId, profileId);
    if (!existingProduct) {
      throw new NotFoundException("Producto no encontrado");
    }

    // Check SKU uniqueness if SKU is being changed
    if (data.sku && data.sku !== existingProduct.sku) {
      const existingWithSku = await this.productRepository.findBySkuAndProfile(data.sku, profileId);
      if (existingWithSku) {
        throw new ConflictException(`Ya existe un producto con SKU: ${data.sku}`);
      }
    }

    // Convert price/cost to string if provided as number
    const updateData: Record<string, unknown> = { ...data };
    if (typeof data.price === 'number') {
      updateData.price = data.price.toString();
    }
    if (typeof data.cost === 'number') {
      updateData.cost = data.cost.toString();
    }

    return this.productRepository.updateByIdAndProfile(productId, profileId, updateData as Parameters<typeof this.productRepository.updateByIdAndProfile>[2]);
  }
}
