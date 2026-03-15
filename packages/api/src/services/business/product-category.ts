import {
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "../../utils/http-exceptions";
import { ProductCategoryRepository } from "../repository/product-category";
import type { ProductCategory, NewProductCategory } from "../../db/schema/product-category";
import type { RequestContext } from "../../types/context";

export interface CreateCategoryInput {
  profileId?: string;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
  color?: string;
  icon?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface SearchCategoriesQuery {
  searchTerm?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  profileId?: string;
}

export class ProductCategoryService {
  constructor(
    private categoryRepository: ProductCategoryRepository,
  ) {}

  /**
   * Create a new product category
   */
  async createCategory(ctx: RequestContext, data: CreateCategoryInput): Promise<ProductCategory> {
    // Validate required fields
    if (!data.name) {
      throw new BadRequestException("El nombre de la categoría es requerido");
    }

    // Profile ID is required - either from input or derived
    if (!data.profileId) {
      throw new BadRequestException("ID de perfil es requerido");
    }

    // Check name uniqueness for this profile
    const existingCategory = await this.categoryRepository.findByName(ctx, data.name);
    if (existingCategory) {
      throw new ConflictException(`Ya existe una categoría con el nombre: ${data.name}`);
    }

    // Create the category
    const newCategory = await this.categoryRepository.create({
      profileId: data.profileId,
      name: data.name,
      description: data.description,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder ?? 0,
      isActive: true,
    });

    return newCategory;
  }

  /**
   * Get category by ID
   */
  async getCategory(ctx: RequestContext, id: string, profileId: string): Promise<ProductCategory | null> {
    const category = await this.categoryRepository.findByIdAndProfile(id, profileId);
    if (!category) {
      throw new NotFoundException("Categoría no encontrada");
    }
    return category;
  }

  /**
   * Get all categories for a profile
   */
  async getCategories(ctx: RequestContext, query: SearchCategoriesQuery): Promise<ProductCategory[]> {
    if (!query.profileId) {
      throw new BadRequestException("ID de perfil es requerido");
    }

    return this.categoryRepository.findByProfileIdDirect(query.profileId, {
      limit: query.limit,
      offset: query.offset,
      isActive: query.isActive,
    });
  }

  /**
   * Update a category
   */
  async updateCategory(ctx: RequestContext, id: string, profileId: string, data: UpdateCategoryInput): Promise<ProductCategory> {
    // Check if category exists
    const existingCategory = await this.categoryRepository.findByIdAndProfile(id, profileId);
    if (!existingCategory) {
      throw new NotFoundException("Categoría no encontrada");
    }

    // Check name uniqueness if name is being changed
    if (data.name && data.name !== existingCategory.name) {
      const existingWithName = await this.categoryRepository.findByName(ctx, data.name);
      if (existingWithName) {
        throw new ConflictException(`Ya existe una categoría con el nombre: ${data.name}`);
      }
    }

    // Update the category
    const updatedCategory = await this.categoryRepository.update(ctx, id, data);
    if (!updatedCategory) {
      throw new NotFoundException("Categoría no encontrada");
    }

    return updatedCategory;
  }

  /**
   * Delete a category (soft delete)
   */
  async deleteCategory(ctx: RequestContext, id: string, profileId: string): Promise<void> {
    // Check if category exists
    const existingCategory = await this.categoryRepository.findByIdAndProfile(id, profileId);
    if (!existingCategory) {
      throw new NotFoundException("Categoría no encontrada");
    }

    // Soft delete - set isActive to false
    await this.categoryRepository.delete(ctx, id);
  }

  /**
   * Search categories by name
   */
  async searchCategories(ctx: RequestContext, query: SearchCategoriesQuery): Promise<ProductCategory[]> {
    if (!query.profileId) {
      throw new BadRequestException("ID de perfil es requerido");
    }

    if (query.searchTerm) {
      return this.categoryRepository.searchByName(ctx, query.searchTerm, {
        limit: query.limit,
        offset: query.offset,
        isActive: query.isActive,
      });
    }

    return this.categoryRepository.findByProfileIdDirect(query.profileId, {
      limit: query.limit,
      offset: query.offset,
      isActive: query.isActive,
    });
  }
}
