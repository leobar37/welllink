import { NotFoundException, BadRequestException } from "../../utils/http-exceptions";
import { SupplierProductRepository } from "../repository/supplier-product";
import { SupplierRepository } from "../repository/supplier";
import { ProductRepository } from "../repository/product";
import type { SupplierProduct, NewSupplierProduct } from "../../db/schema/supplier-product";
import type { RequestContext } from "../../types/context";

export interface CreateSupplierProductInput {
  supplierId: string;
  productId: string;
  supplierSku?: string;
  costPrice?: number | string;
  leadTimeDays?: number;
  minOrderQty?: number;
  isPrimary?: boolean;
  notes?: string;
}

export interface UpdateSupplierProductInput {
  supplierSku?: string;
  costPrice?: number | string;
  leadTimeDays?: number;
  minOrderQty?: number;
  isPrimary?: boolean;
  notes?: string;
  isActive?: boolean;
}

export class SupplierProductService {
  constructor(
    private supplierProductRepository: SupplierProductRepository,
    private supplierRepository: SupplierRepository,
    private productRepository: ProductRepository,
  ) {}

  /**
   * Create a supplier-product association
   */
  async createSupplierProduct(
    ctx: RequestContext,
    profileId: string,
    data: CreateSupplierProductInput
  ): Promise<SupplierProduct> {
    // Validate supplier exists
    const supplier = await this.supplierRepository.findByIdAndProfile(
      data.supplierId,
      profileId
    );
    if (!supplier) {
      throw new NotFoundException("Proveedor no encontrado");
    }

    // Validate product exists
    const product = await this.productRepository.findByIdAndProfile(
      data.productId,
      profileId
    );
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    // Check if association already exists
    const exists = await this.supplierProductRepository.exists(
      data.supplierId,
      data.productId,
      profileId
    );
    if (exists) {
      throw new BadRequestException(
        "Ya existe una asociación entre este proveedor y producto"
      );
    }

    // If this is set as primary, unset other primaries first
    if (data.isPrimary) {
      await this.unsetPrimaryForProduct(data.productId, profileId);
    }

    // Create the association
    const supplierProduct = await this.supplierProductRepository.create({
      profileId,
      supplierId: data.supplierId,
      productId: data.productId,
      supplierSku: data.supplierSku,
      costPrice: data.costPrice ? String(data.costPrice) : null,
      leadTimeDays: data.leadTimeDays,
      minOrderQty: data.minOrderQty,
      isPrimary: data.isPrimary ?? false,
      notes: data.notes,
      isActive: true,
    });

    return supplierProduct;
  }

  /**
   * Get all products for a supplier
   */
  async getProductsBySupplier(
    ctx: RequestContext,
    profileId: string,
    supplierId: string,
    options?: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
    }
  ): Promise<SupplierProduct[]> {
    // Validate supplier exists
    const supplier = await this.supplierRepository.findByIdAndProfile(
      supplierId,
      profileId
    );
    if (!supplier) {
      throw new NotFoundException("Proveedor no encontrado");
    }

    return this.supplierProductRepository.findBySupplierIdAndProfile(
      supplierId,
      profileId,
      options
    );
  }

  /**
   * Get all suppliers for a product
   */
  async getSuppliersByProduct(
    ctx: RequestContext,
    profileId: string,
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
    }
  ): Promise<SupplierProduct[]> {
    // Validate product exists
    const product = await this.productRepository.findByIdAndProfile(
      productId,
      profileId
    );
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    return this.supplierProductRepository.findByProductIdAndProfile(
      productId,
      profileId,
      options
    );
  }

  /**
   * Get a single supplier-product association
   */
  async getSupplierProduct(
    ctx: RequestContext,
    profileId: string,
    id: string
  ): Promise<SupplierProduct | null> {
    return this.supplierProductRepository.findByIdAndProfile(id, profileId);
  }

  /**
   * Update a supplier-product association
   */
  async updateSupplierProduct(
    ctx: RequestContext,
    profileId: string,
    id: string,
    data: UpdateSupplierProductInput
  ): Promise<SupplierProduct> {
    // Validate association exists
    const existing = await this.supplierProductRepository.findByIdAndProfile(
      id,
      profileId
    );
    if (!existing) {
      throw new NotFoundException("Asociación de proveedor-producto no encontrada");
    }

    // If setting as primary, unset other primaries first
    if (data.isPrimary && !existing.isPrimary) {
      await this.unsetPrimaryForProduct(existing.productId, profileId);
    }

    return this.supplierProductRepository.updateByIdAndProfile(id, profileId, {
      supplierSku: data.supplierSku,
      costPrice: data.costPrice ? String(data.costPrice) : null,
      leadTimeDays: data.leadTimeDays,
      minOrderQty: data.minOrderQty,
      isPrimary: data.isPrimary,
      notes: data.notes,
      isActive: data.isActive,
    });
  }

  /**
   * Delete a supplier-product association (soft delete)
   */
  async deleteSupplierProduct(
    ctx: RequestContext,
    profileId: string,
    id: string
  ): Promise<void> {
    // Validate association exists
    const existing = await this.supplierProductRepository.findByIdAndProfile(
      id,
      profileId
    );
    if (!existing) {
      throw new NotFoundException("Asociación de proveedor-producto no encontrada");
    }

    await this.supplierProductRepository.deleteByIdAndProfile(id, profileId);
  }

  /**
   * Get primary supplier for a product
   */
  async getPrimarySupplier(
    ctx: RequestContext,
    profileId: string,
    productId: string
  ): Promise<SupplierProduct | null> {
    return this.supplierProductRepository.findPrimaryByProductIdAndProfile(
      productId,
      profileId
    );
  }

  /**
   * Set a supplier-product as primary
   */
  async setAsPrimary(
    ctx: RequestContext,
    profileId: string,
    id: string
  ): Promise<SupplierProduct> {
    // Validate association exists
    const existing = await this.supplierProductRepository.findByIdAndProfile(
      id,
      profileId
    );
    if (!existing) {
      throw new NotFoundException("Asociación de proveedor-producto no encontrada");
    }

    // Unset other primaries for this product
    await this.unsetPrimaryForProduct(existing.productId, profileId);

    // Set this one as primary
    return this.supplierProductRepository.updateByIdAndProfile(id, profileId, {
      isPrimary: true,
    });
  }

  /**
   * Get count of products for a supplier
   */
  async countProductsBySupplier(
    profileId: string,
    supplierId: string,
    isActive?: boolean
  ): Promise<number> {
    return this.supplierProductRepository.countBySupplierId(
      supplierId,
      profileId,
      { isActive }
    );
  }

  /**
   * Get count of suppliers for a product
   */
  async countSuppliersByProduct(
    profileId: string,
    productId: string,
    isActive?: boolean
  ): Promise<number> {
    return this.supplierProductRepository.countByProductId(
      productId,
      profileId,
      { isActive }
    );
  }

  /**
   * Helper: Unset primary flag for all supplier-product associations of a product
   */
  private async unsetPrimaryForProduct(productId: string, profileId: string): Promise<void> {
    const associations = await this.supplierProductRepository.findByProductIdAndProfile(
      productId,
      profileId,
      { isActive: true }
    );

    for (const assoc of associations) {
      if (assoc.isPrimary) {
        await this.supplierProductRepository.updateByIdAndProfile(
          assoc.id,
          profileId,
          { isPrimary: false }
        );
      }
    }
  }
}
