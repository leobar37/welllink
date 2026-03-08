import { describe, it, expect, beforeEach, jest } from "bun:test";
import { ProductService } from "./product";
import type { ProductRepository } from "../repository/product";
import type { InventoryRepository } from "../repository/inventory";

// Mock the dependencies
const mockProductRepository: Partial<ProductRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndProfile: jest.fn(),
  findByProfileId: jest.fn(),
  findByProfileIdDirect: jest.fn(),
  searchByNameOrSkuDirect: jest.fn(),
  searchByNameOrSku: jest.fn(),
  findBySku: jest.fn(),
  findBySkuAndProfile: jest.fn(),
  update: jest.fn(),
  updateByIdAndProfile: jest.fn(),
  delete: jest.fn(),
  hardDelete: jest.fn(),
  count: jest.fn(),
};

const mockInventoryRepository: Partial<InventoryRepository> = {
  findById: jest.fn(),
  findByProductId: jest.fn(),
  findByProductIdAndLocation: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  adjustStock: jest.fn(),
  adjustStockDirect: jest.fn(),
  getTotalValue: jest.fn(),
  getLowStock: jest.fn(),
  getByProfileId: jest.fn(),
  getMovementHistory: jest.fn(),
  getLowStockItemsWithProduct: jest.fn(),
  getStockDirect: jest.fn(),
};

const mockContext = {
  userId: "user-123",
  profileId: "profile-123",
};

describe("ProductService", () => {
  let service: ProductService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    service = new ProductService(
      mockProductRepository as ProductRepository,
      mockInventoryRepository as InventoryRepository,
    );
  });

  describe("createProduct", () => {
    it("should create product with valid data", async () => {
      // Arrange
      const productData = {
        name: "Shampoo",
        sku: "SHA-001",
        description: "Shampoo para cabello",
        price: 1500,
        cost: 800,
        unit: "unit",
        categoryId: "cat-1",
        supplierId: "sup-1",
        profileId: "profile-123",
        initialStock: 10,
      };

      (mockProductRepository.findBySkuAndProfile as jest.Mock).mockResolvedValue(null);
      (mockProductRepository.create as jest.Mock).mockResolvedValue({
        id: "product-1",
        ...productData,
        isActive: true,
      });
      (mockInventoryRepository.adjustStockDirect as jest.Mock).mockResolvedValue({
        inventoryItem: {
          id: "inv-1",
          productId: "product-1",
          quantity: 10,
        },
      });
      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "product-1",
        ...productData,
        isActive: true,
      });

      // Act
      const result = await service.createProduct(mockContext as any, productData);

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe("Shampoo");
      expect(mockProductRepository.create).toHaveBeenCalled();
      expect(mockInventoryRepository.adjustStockDirect).toHaveBeenCalled();
    });

    it("should throw error when SKU is missing", async () => {
      // Arrange
      const productData = {
        name: "Shampoo",
        price: 1500,
        profileId: "profile-123",
      };

      // Act & Assert
      await expect(
        service.createProduct(mockContext as any, productData as any)
      ).rejects.toThrow("SKU es requerido");
    });

    it("should throw error when name is missing", async () => {
      // Arrange
      const productData = {
        sku: "SHA-001",
        price: 1500,
        profileId: "profile-123",
      };

      // Act & Assert
      await expect(
        service.createProduct(mockContext as any, productData as any)
      ).rejects.toThrow("Nombre del producto es requerido");
    });

    it("should throw error when price is missing", async () => {
      // Arrange
      const productData = {
        sku: "SHA-001",
        name: "Shampoo",
        profileId: "profile-123",
      };

      // Act & Assert
      await expect(
        service.createProduct(mockContext as any, productData as any)
      ).rejects.toThrow("Precio es requerido");
    });

    it("should throw error when profileId is missing", async () => {
      // Arrange
      const productData = {
        sku: "SHA-001",
        name: "Shampoo",
        price: 1500,
      };

      // Act & Assert
      await expect(
        service.createProduct(mockContext as any, productData as any)
      ).rejects.toThrow("ID de perfil es requerido");
    });

    it("should throw error when SKU already exists", async () => {
      // Arrange
      const productData = {
        name: "Shampoo",
        sku: "SHA-001",
        price: 1500,
        profileId: "profile-123",
      };

      (mockProductRepository.findBySkuAndProfile as jest.Mock).mockResolvedValue({
        id: "existing-product",
        sku: "SHA-001",
      });

      // Act & Assert
      await expect(
        service.createProduct(mockContext as any, productData)
      ).rejects.toThrow("Ya existe un producto con SKU: SHA-001");
    });

    it("should create product without initial stock", async () => {
      // Arrange
      const productData = {
        name: "Shampoo",
        sku: "SHA-001",
        price: 1500,
        profileId: "profile-123",
      };

      (mockProductRepository.findBySkuAndProfile as jest.Mock).mockResolvedValue(null);
      (mockProductRepository.create as jest.Mock).mockResolvedValue({
        id: "product-1",
        ...productData,
        isActive: true,
      });
      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "product-1",
        ...productData,
        isActive: true,
      });

      // Act
      const result = await service.createProduct(mockContext as any, productData);

      // Assert
      expect(result).toBeDefined();
      expect(mockInventoryRepository.adjustStockDirect).not.toHaveBeenCalled();
    });
  });

  describe("getProduct", () => {
    it("should return product when found", async () => {
      // Arrange
      const mockProduct = {
        id: "product-1",
        name: "Shampoo",
        sku: "SHA-001",
        isActive: true,
      };

      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(mockProduct);
      (mockInventoryRepository.getStockDirect as jest.Mock).mockResolvedValue({ quantity: 10 });

      // Act
      const result = await service.getProduct(mockContext as any, "product-1", "profile-123");

      // Assert
      expect(result).toBeDefined();
    });

    it("should throw error when product not found", async () => {
      // Arrange
      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getProduct(mockContext as any, "non-existent", "profile-123")
      ).rejects.toThrow("Producto no encontrado");
    });
  });

  describe("searchProducts", () => {
    it("should return products matching search term", async () => {
      // Arrange
      const mockProducts = [
        { id: "product-1", name: "Shampoo", sku: "SHA-001" },
        { id: "product-2", name: "Acondicionador", sku: "ACOND-001" },
      ];

      (mockProductRepository.findByProfileIdDirect as jest.Mock).mockResolvedValue(mockProducts);
      (mockInventoryRepository.getStockDirect as jest.Mock)
        .mockResolvedValueOnce({ quantity: 10 })
        .mockResolvedValueOnce({ quantity: 5 });

      // Act
      const result = await service.searchProducts(mockContext as any, {
        searchTerm: "shampoo",
        profileId: "profile-123",
      });

      // Assert
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should apply category filter", async () => {
      // Arrange
      const mockProducts = [
        { id: "product-1", name: "Shampoo", categoryId: "cat-1" },
      ];

      (mockProductRepository.findByProfileIdDirect as jest.Mock).mockResolvedValue(mockProducts);
      (mockInventoryRepository.getStockDirect as jest.Mock).mockResolvedValue({ quantity: 10 });

      // Act
      const result = await service.searchProducts(mockContext as any, {
        categoryId: "cat-1",
        profileId: "profile-123",
      });

      // Assert
      expect(result).toHaveLength(1);
    });

    it("should throw error when profileId is missing", async () => {
      // Act & Assert
      await expect(
        service.searchProducts(mockContext as any, { searchTerm: "test" })
      ).rejects.toThrow("ID de perfil es requerido");
    });
  });

  describe("updateProduct", () => {
    it("should update product with valid data", async () => {
      // Arrange
      const updateData = {
        name: "Shampoo Premium",
        price: "2000",
      };

      const existingProduct = {
        id: "product-1",
        name: "Shampoo",
        sku: "SHA-001",
        isActive: true,
      };

      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingProduct);
      (mockProductRepository.updateByIdAndProfile as jest.Mock).mockResolvedValue({
        ...existingProduct,
        ...updateData,
      });

      // Act
      const result = await service.updateProduct(
        mockContext as any,
        "product-1",
        "profile-123",
        updateData
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.name).toBe("Shampoo Premium");
    });

    it("should throw error when product not found", async () => {
      // Arrange
      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updateProduct(mockContext as any, "non-existent", "profile-123", {
          name: "New Name",
        })
      ).rejects.toThrow("Producto no encontrado");
    });

    it("should throw error when SKU already exists for another product", async () => {
      // Arrange
      const existingProduct = {
        id: "product-1",
        name: "Shampoo",
        sku: "SHA-001",
      };

      const otherProduct = {
        id: "product-2",
        sku: "NEW-SKU",
      };

      (mockProductRepository.findByIdAndProfile as jest.Mock)
        .mockResolvedValueOnce(existingProduct)
        .mockResolvedValueOnce(existingProduct);
      (mockProductRepository.findBySkuAndProfile as jest.Mock).mockResolvedValue(otherProduct);

      // Act & Assert
      await expect(
        service.updateProduct(
          mockContext as any,
          "product-1",
          "profile-123",
          { sku: "NEW-SKU" }
        )
      ).rejects.toThrow("Ya existe un producto con SKU: NEW-SKU");
    });
  });

  describe("deleteProduct", () => {
    it("should soft delete product", async () => {
      // Arrange
      const existingProduct = {
        id: "product-1",
        name: "Shampoo",
        isActive: true,
      };

      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingProduct);
      (mockProductRepository.delete as jest.Mock).mockResolvedValue({
        ...existingProduct,
        deletedAt: new Date(),
      });

      // Act
      await service.deleteProduct(mockContext as any, "product-1", "profile-123");

      // Assert
      expect(mockProductRepository.delete).toHaveBeenCalled();
    });

    it("should throw error when product not found", async () => {
      // Arrange
      (mockProductRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.deleteProduct(mockContext as any, "non-existent", "profile-123")
      ).rejects.toThrow("Producto no encontrado");
    });
  });

  describe("getLowStockProducts", () => {
    it("should return products below minimum stock", async () => {
      // Arrange
      const mockProducts = [
        { id: "product-1", name: "Shampoo", sku: "SHA-001", quantity: 2, minStock: 5 },
      ];

      (mockInventoryRepository.getLowStockItemsWithProduct as jest.Mock).mockResolvedValue(
        mockProducts as any
      );

      // Act
      const result = await service.getLowStockProducts("profile-123");

      // Assert
      expect(result).toBeDefined();
    });
  });

  describe("getProductBySku", () => {
    it("should return product when SKU found", async () => {
      // Arrange
      const mockProduct = {
        id: "product-1",
        name: "Shampoo",
        sku: "SHA-001",
      };

      (mockProductRepository.findBySkuAndProfile as jest.Mock).mockResolvedValue(mockProduct);
      (mockInventoryRepository.getStockDirect as jest.Mock).mockResolvedValue({ quantity: 10 });

      // Act
      const result = await service.getProductBySku(mockContext as any, "SHA-001", "profile-123");

      // Assert
      expect(result).toBeDefined();
    });

    it("should return null when SKU not found", async () => {
      // Arrange
      (mockProductRepository.findBySkuAndProfile as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getProductBySku(mockContext as any, "NONEXISTENT", "profile-123");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("checkSufficientStock", () => {
    it("should return sufficient when stock is available", async () => {
      // Arrange
      (mockInventoryRepository.getStockDirect as jest.Mock).mockResolvedValue({ availableQuantity: 10 });

      // Act
      const result = await service.checkSufficientStock("product-1", "profile-123", 5);

      // Assert
      expect(result.sufficient).toBe(true);
    });

    it("should return insufficient when stock is low", async () => {
      // Arrange
      (mockInventoryRepository.getStockDirect as jest.Mock).mockResolvedValue({ availableQuantity: 3 });

      // Act
      const result = await service.checkSufficientStock("product-1", "profile-123", 5);

      // Assert
      expect(result.sufficient).toBe(false);
    });

    it("should return insufficient when no stock", async () => {
      // Arrange
      (mockInventoryRepository.getStockDirect as jest.Mock).mockResolvedValue({ availableQuantity: 0 });

      // Act
      const result = await service.checkSufficientStock("product-1", "profile-123", 1);

      // Assert
      expect(result.sufficient).toBe(false);
    });
  });
});
