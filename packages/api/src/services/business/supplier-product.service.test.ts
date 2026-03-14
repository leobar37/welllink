import { describe, it, expect, beforeEach, jest } from "bun:test";
import { SupplierProductService, CreateSupplierProductInput, UpdateSupplierProductInput } from "./supplier-product";
import type { SupplierProductRepository } from "../repository/supplier-product";
import type { SupplierRepository } from "../repository/supplier";
import type { ProductRepository } from "../repository/product";

// Mock the dependencies
const mockSupplierProductRepository: Partial<SupplierProductRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndProfile: jest.fn(),
  findBySupplierId: jest.fn(),
  findBySupplierIdAndProfile: jest.fn(),
  findByProductId: jest.fn(),
  findByProductIdAndProfile: jest.fn(),
  findPrimaryByProductIdAndProfile: jest.fn(),
  findBySupplierIdWithProduct: jest.fn(),
  exists: jest.fn(),
  update: jest.fn(),
  updateByIdAndProfile: jest.fn(),
  setPrimary: jest.fn(),
  delete: jest.fn(),
  deleteByIdAndProfile: jest.fn(),
  hardDelete: jest.fn(),
  countBySupplierId: jest.fn(),
  countByProductId: jest.fn(),
};

const mockSupplierRepository: Partial<SupplierRepository> = {
  findById: jest.fn(),
  findByIdAndProfile: jest.fn(),
  findByProfileId: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  hardDelete: jest.fn(),
  count: jest.fn(),
  searchByName: jest.fn(),
  findByEmail: jest.fn(),
  updateByIdAndProfile: jest.fn(),
  findByProfileIdDirect: jest.fn(),
};

const mockProductRepository: Partial<ProductRepository> = {
  findById: jest.fn(),
  findByIdAndProfile: jest.fn(),
  findByProfileId: jest.fn(),
  findByProfileIdDirect: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  updateByIdAndProfile: jest.fn(),
  delete: jest.fn(),
  hardDelete: jest.fn(),
  count: jest.fn(),
  searchByNameOrSkuDirect: jest.fn(),
  searchByNameOrSku: jest.fn(),
  findBySku: jest.fn(),
  findBySkuAndProfile: jest.fn(),
};

const mockContext = {
  userId: "user-123",
  profileId: "profile-123",
};

describe("SupplierProductService", () => {
  let service: SupplierProductService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    service = new SupplierProductService(
      mockSupplierProductRepository as SupplierProductRepository,
      mockSupplierRepository as SupplierRepository,
      mockProductRepository as ProductRepository,
    );
  });

  describe("createSupplierProduct", () => {
    it("should create supplier-product association", async () => {
      // Arrange
      const input: CreateSupplierProductInput = {
        supplierId: "supplier-1",
        productId: "product-1",
        supplierSku: "SUP-SKU-001",
        costPrice: 500,
        isPrimary: false, // Don't set primary to avoid needing extra mocks
      };

      (mockSupplierRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "supplier-1",
        name: "Proveedor Test",
      });
      
      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });
      
      (mockSupplierProductRepository.exists as jest.Mock).mockResolvedValue(false);
      
      (mockSupplierProductRepository.create as jest.Mock).mockResolvedValue({
        id: "sp-1",
        supplierId: "supplier-1",
        productId: "product-1",
        isPrimary: false,
      });

      // Act
      const result = await service.createSupplierProduct(
        mockContext as any,
        "profile-123",
        input
      );

      // Assert
      expect(result).toBeDefined();
    });

    it("should throw error when supplier not found", async () => {
      // Arrange
      const input: CreateSupplierProductInput = {
        supplierId: "nonexistent",
        productId: "product-1",
      };

      (mockSupplierRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createSupplierProduct(mockContext as any, "profile-123", input)
      ).rejects.toThrow("Proveedor no encontrado");
    });

    it("should throw error when product not found", async () => {
      // Arrange
      const input: CreateSupplierProductInput = {
        supplierId: "supplier-1",
        productId: "nonexistent",
      };

      (mockSupplierRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "supplier-1",
        name: "Proveedor Test",
      });
      
      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.createSupplierProduct(mockContext as any, "profile-123", input)
      ).rejects.toThrow("Producto no encontrado");
    });

    it("should throw error when association already exists", async () => {
      // Arrange
      const input: CreateSupplierProductInput = {
        supplierId: "supplier-1",
        productId: "product-1",
      };

      (mockSupplierRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "supplier-1",
        name: "Proveedor Test",
      });
      
      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });
      
      (mockSupplierProductRepository.exists as jest.Mock).mockResolvedValue(true);

      // Act & Assert
      await expect(
        service.createSupplierProduct(mockContext as any, "profile-123", input)
      ).rejects.toThrow("Ya existe una asociación");
    });
  });

  describe("getProductsBySupplier", () => {
    it("should return products for a supplier", async () => {
      // Arrange
      const mockProducts = [
        { id: "sp-1", productId: "product-1" },
        { id: "sp-2", productId: "product-2" },
      ];

      (mockSupplierProductRepository.findBySupplierIdWithProduct as jest.Mock).mockResolvedValue(mockProducts);

      // Act
      const result = await service.getProductsBySupplier(mockContext as any, "profile-123", "supplier-1");

      // Assert
      expect(result).toHaveLength(2);
    });
  });

  describe("getSuppliersByProduct", () => {
    it("should return suppliers for a product", async () => {
      // Arrange
      const mockSuppliers = [
        { id: "sp-1", supplierId: "supplier-1" },
        { id: "sp-2", supplierId: "supplier-2" },
      ];

      (mockSupplierProductRepository.findByProductIdAndProfile as jest.Mock).mockResolvedValue(mockSuppliers);

      // Act
      const result = await service.getSuppliersByProduct(mockContext as any, "profile-123", "product-1");

      // Assert
      expect(result).toHaveLength(2);
    });
  });

  describe("getSupplierProduct", () => {
    it("should return supplier product when found", async () => {
      // Arrange
      const mockProduct = {
        id: "sp-1",
        supplierId: "supplier-1",
        productId: "product-1",
      };

      (mockSupplierProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(mockProduct);

      // Act
      const result = await service.getSupplierProduct(mockContext as any, "profile-123", "sp-1");

      // Assert
      expect(result).toBeDefined();
    });

    it("should return null when not found", async () => {
      // Arrange
      (mockSupplierProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getSupplierProduct(mockContext as any, "profile-123", "nonexistent");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("updateSupplierProduct", () => {
    it("should update supplier product", async () => {
      // Arrange
      const existing = {
        id: "sp-1",
        supplierId: "supplier-1",
        productId: "product-1",
        isPrimary: true, // Keep primary to avoid needing extra mocks
      };

      const input: UpdateSupplierProductInput = {
        costPrice: 600,
      };

      (mockSupplierProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existing);
      
      (mockSupplierProductRepository.updateByIdAndProfile as jest.Mock).mockResolvedValue({
        ...existing,
        ...input,
      });

      // Act
      const result = await service.updateSupplierProduct(
        mockContext as any,
        "profile-123",
        "sp-1",
        input
      );

      // Assert
      expect(result).toBeDefined();
    });

    it("should throw error when not found", async () => {
      // Arrange
      (mockSupplierProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateSupplierProduct(mockContext as any, "profile-123", "nonexistent", { costPrice: 500 })
      ).rejects.toThrow("Asociación de proveedor-producto no encontrada");
    });
  });

  describe("deleteSupplierProduct", () => {
    it("should delete supplier product", async () => {
      // Arrange
      const existing = {
        id: "sp-1",
        isActive: true,
      };

      (mockSupplierProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existing);
      
      (mockSupplierProductRepository.deleteByIdAndProfile as jest.Mock).mockResolvedValue({
        ...existing,
        isActive: false,
      });

      // Act
      await service.deleteSupplierProduct(mockContext as any, "profile-123", "sp-1");

      // Assert
      expect(mockSupplierProductRepository.deleteByIdAndProfile).toHaveBeenCalled();
    });

    it("should throw error when not found", async () => {
      // Arrange
      (mockSupplierProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteSupplierProduct(mockContext as any, "profile-123", "nonexistent")
      ).rejects.toThrow("Asociación de proveedor-producto no encontrada");
    });
  });

  describe("getPrimarySupplier", () => {
    it("should return primary supplier for a product", async () => {
      // Arrange
      const mockPrimary = {
        id: "sp-1",
        supplierId: "supplier-1",
        productId: "product-1",
        isPrimary: true,
      };

      (mockSupplierProductRepository.findPrimaryByProductIdAndProfile as jest.Mock).mockResolvedValue(mockPrimary);

      // Act
      const result = await service.getPrimarySupplier(mockContext as any, "profile-123", "product-1");

      // Assert
      expect(result).toBeDefined();
      expect(result?.isPrimary).toBe(true);
    });

    it("should return null when no primary supplier", async () => {
      // Arrange
      (mockSupplierProductRepository.findPrimaryByProductIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getPrimarySupplier(mockContext as any, "profile-123", "product-1");

      // Assert
      expect(result).toBeNull();
    });
  });
});
