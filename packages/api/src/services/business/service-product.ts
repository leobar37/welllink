import { NotFoundException, BadRequestException } from "../../utils/http-exceptions";
import { ServiceProductRepository, type ServiceProductWithProduct } from "../repository/service-product";
import { ServiceRepository } from "../repository/service";
import { ProductRepository } from "../repository/product";
import type { ServiceProduct, NewServiceProduct } from "../../db/schema/service-product";
import type { RequestContext } from "../../types/context";

export interface ReplaceProductsForServiceInput {
  productId: string;
  quantityRequired?: number;
  isRequired?: boolean;
  notes?: string;
}

export interface CreateServiceProductInput {
  serviceId: string;
  productId: string;
  quantityRequired?: number;
  isRequired?: boolean;
  notes?: string;
}

export interface UpdateServiceProductInput {
  quantityRequired?: number;
  isRequired?: boolean;
  notes?: string;
  isActive?: boolean;
}

export class ServiceProductService {
  constructor(
    private serviceProductRepository: ServiceProductRepository,
    private serviceRepository: ServiceRepository,
    private productRepository: ProductRepository,
  ) {}

  /**
   * Create a service-product association
   */
  async createServiceProduct(
    ctx: RequestContext,
    profileId: string,
    data: CreateServiceProductInput
  ): Promise<ServiceProduct> {
    // Validate service exists
    const service = await this.serviceRepository.findById(data.serviceId);
    if (!service || service.profileId !== profileId) {
      throw new NotFoundException("Servicio no encontrado");
    }

    // Validate product exists
    const product = await this.productRepository.findByIdAndProfile(
      data.productId,
      profileId
    );
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    // Validate quantityRequired > 0
    if (data.quantityRequired !== undefined && data.quantityRequired <= 0) {
      throw new BadRequestException("La cantidad requerida debe ser mayor a 0");
    }

    // Check if association already exists
    const exists = await this.serviceProductRepository.exists(
      data.serviceId,
      data.productId,
      profileId
    );
    if (exists) {
      throw new BadRequestException(
        "Ya existe una asociación entre este servicio y producto"
      );
    }

    // Create the association
    const serviceProduct = await this.serviceProductRepository.create({
      profileId,
      serviceId: data.serviceId,
      productId: data.productId,
      quantityRequired: data.quantityRequired ?? 1,
      isRequired: data.isRequired ?? true,
      notes: data.notes,
      isActive: true,
    });

    return serviceProduct;
  }

  /**
   * Get all products for a service
   */
  async getProductsByService(
    ctx: RequestContext,
    profileId: string,
    serviceId: string,
    options?: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
    }
  ): Promise<ServiceProductWithProduct[]> {
    // Validate service exists
    const service = await this.serviceRepository.findById(serviceId);
    if (!service || service.profileId !== profileId) {
      throw new NotFoundException("Servicio no encontrado");
    }

    return this.serviceProductRepository.findByServiceIdWithProduct(
      serviceId,
      profileId,
      options
    );
  }

  /**
   * Get all services for a product
   */
  async getServicesByProduct(
    ctx: RequestContext,
    profileId: string,
    productId: string,
    options?: {
      limit?: number;
      offset?: number;
      isActive?: boolean;
    }
  ): Promise<ServiceProduct[]> {
    // Validate product exists
    const product = await this.productRepository.findByIdAndProfile(
      productId,
      profileId
    );
    if (!product) {
      throw new NotFoundException("Producto no encontrado");
    }

    return this.serviceProductRepository.findByProductIdAndProfile(
      productId,
      profileId,
      options
    );
  }

  /**
   * Get a single service-product association
   */
  async getServiceProduct(
    ctx: RequestContext,
    profileId: string,
    id: string
  ): Promise<ServiceProduct | null> {
    return this.serviceProductRepository.findByIdAndProfile(id, profileId);
  }

  /**
   * Update a service-product association
   */
  async updateServiceProduct(
    ctx: RequestContext,
    profileId: string,
    id: string,
    data: UpdateServiceProductInput
  ): Promise<ServiceProduct> {
    // Validate association exists
    const existing = await this.serviceProductRepository.findByIdAndProfile(
      id,
      profileId
    );
    if (!existing) {
      throw new NotFoundException("Asociación de servicio-producto no encontrada");
    }

    // Validate quantityRequired > 0
    if (data.quantityRequired !== undefined && data.quantityRequired <= 0) {
      throw new BadRequestException("La cantidad requerida debe ser mayor a 0");
    }

    return this.serviceProductRepository.updateByIdAndProfile(id, profileId, {
      quantityRequired: data.quantityRequired,
      isRequired: data.isRequired,
      notes: data.notes,
      isActive: data.isActive,
    });
  }

  /**
   * Delete a service-product association (soft delete)
   */
  async deleteServiceProduct(
    ctx: RequestContext,
    profileId: string,
    id: string
  ): Promise<void> {
    // Validate association exists
    const existing = await this.serviceProductRepository.findByIdAndProfile(
      id,
      profileId
    );
    if (!existing) {
      throw new NotFoundException("Asociación de servicio-producto no encontrada");
    }

    await this.serviceProductRepository.deleteByIdAndProfile(id, profileId);
  }

  /**
   * Replace all product associations for a service
   * This is useful when updating a service's product list
   */
  async replaceProductsForService(
    ctx: RequestContext,
    profileId: string,
    serviceId: string,
    products: ReplaceProductsForServiceInput[]
  ): Promise<ServiceProduct[]> {
    // Validate service exists
    const service = await this.serviceRepository.findById(serviceId);
    if (!service || service.profileId !== profileId) {
      throw new NotFoundException("Servicio no encontrado");
    }

    // Validate all products exist
    for (const p of products) {
      const product = await this.productRepository.findByIdAndProfile(
        p.productId,
        profileId
      );
      if (!product) {
        throw new NotFoundException(`Producto no encontrado: ${p.productId}`);
      }
      if (p.quantityRequired !== undefined && p.quantityRequired <= 0) {
        throw new BadRequestException("La cantidad requerida debe ser mayor a 0");
      }
    }

    // Delete existing associations
    await this.serviceProductRepository.deleteByServiceId(serviceId, profileId);

    // Create new associations
    const newAssociations: ServiceProduct[] = [];
    for (const p of products) {
      const newAssoc = await this.serviceProductRepository.create({
        profileId,
        serviceId,
        productId: p.productId,
        quantityRequired: p.quantityRequired ?? 1,
        isRequired: p.isRequired ?? true,
        notes: p.notes,
        isActive: true,
      });
      newAssociations.push(newAssoc);
    }

    return newAssociations;
  }

  /**
   * Get count of products for a service
   */
  async countProductsByService(
    profileId: string,
    serviceId: string,
    isActive?: boolean
  ): Promise<number> {
    return this.serviceProductRepository.countByServiceId(
      serviceId,
      profileId,
      { isActive }
    );
  }

  /**
   * Get count of services for a product
   */
  async countServicesByProduct(
    profileId: string,
    productId: string,
    isActive?: boolean
  ): Promise<number> {
    return this.serviceProductRepository.countByProductId(
      productId,
      profileId,
      { isActive }
    );
  }
}
