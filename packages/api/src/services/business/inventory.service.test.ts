import { describe, it, expect, beforeEach, jest } from "bun:test";
import { InventoryService, AdjustStockInput } from "./inventory";
import type { InventoryRepository } from "../repository/inventory";
import type { ProductRepository } from "../repository/product";

// Mock the dependencies
const mockInventoryRepository: Partial<InventoryRepository> = {
  findItemById: jest.fn(),
  findByProductId: jest.fn(),
  findByProductIdDirect: jest.fn(),
  findByProfileId: jest.fn(),
  getStock: jest.fn(),
  getStockDirect: jest.fn(),
  adjustStock: jest.fn(),
  adjustStockDirect: jest.fn(),
  getMovements: jest.fn(),
  getAllMovements: jest.fn(),
  getLowStockItems: jest.fn(),
  getLowStockItemsWithProduct: jest.fn(),
  getOrCreateInventoryItem: jest.fn(),
  getInventoryValue: jest.fn(),
};

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

const mockContext = {
  userId: "user-123",
  profileId: "profile-123",
};

describe("InventoryService", () => {
  let service: InventoryService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    service = new InventoryService(
      mockInventoryRepository as InventoryRepository,
      mockProductRepository as ProductRepository,
    );
  });

  describe("adjustStock", () => {
    it("should adjust stock with valid data", async () => {
      // Arrange
      const input: AdjustStockInput = {
        productId: "product-1",
        quantity: 10,
        reason: "purchase",
        location: "default",
        notes: "Initial stock",
      };

      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
        sku: "SHA-001",
      });
      
      (mockInventoryRepository.getStock as jest.Mock).mockResolvedValue({
        totalQuantity: 0,
        totalReserved: 0,
        availableQuantity: 0,
      });
      
      (mockInventoryRepository.adjustStock as jest.Mock).mockResolvedValue({
        inventoryItem: {
          id: "inv-1",
          productId: "product-1",
          quantity: 10,
        },
        movement: {
          id: "mov-1",
          productId: "product-1",
          quantity: 10,
        },
      });

      // Act
      const result = await service.adjustStock(mockContext as any, input);

      // Assert
      expect(result).toBeDefined();
      expect(result.inventoryItem.quantity).toBe(10);
    });

    it("should throw error when product not found", async () => {
      // Arrange
      const input: AdjustStockInput = {
        productId: "nonexistent",
        quantity: 10,
        reason: "purchase",
      };

      (mockProductRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.adjustStock(mockContext as any, input)).rejects.toThrow(
        "Producto no encontrado"
      );
    });

    it("should throw error for invalid reason", async () => {
      // Arrange
      const input: AdjustStockInput = {
        productId: "product-1",
        quantity: 10,
        reason: "invalid_reason" as any,
      };

      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });

      // Act & Assert
      await expect(service.adjustStock(mockContext as any, input)).rejects.toThrow(
        "Razón de movimiento inválida"
      );
    });

    it("should throw error when quantity is 0", async () => {
      // Arrange
      const input: AdjustStockInput = {
        productId: "product-1",
        quantity: 0,
        reason: "purchase",
      };

      // Act & Assert
      await expect(service.adjustStock(mockContext as any, input)).rejects.toThrow(
        "La cantidad no puede ser 0"
      );
    });

    it("should throw error when insufficient stock for negative adjustment", async () => {
      // Arrange
      const input: AdjustStockInput = {
        productId: "product-1",
        quantity: -10,
        reason: "sale",
      };

      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });
      
      (mockInventoryRepository.getStock as jest.Mock).mockResolvedValue({
        totalQuantity: 5,
        totalReserved: 0,
        availableQuantity: 5,
      });

      // Act & Assert
      await expect(service.adjustStock(mockContext as any, input)).rejects.toThrow(
        "Stock insuficiente"
      );
    });
  });

  describe("getStock", () => {
    it("should return stock for valid product", async () => {
      // Arrange
      const productId = "product-1";
      
      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });
      
      (mockInventoryRepository.getStock as jest.Mock).mockResolvedValue({
        totalQuantity: 100,
        totalReserved: 10,
        availableQuantity: 90,
      });

      // Act
      const result = await service.getStock(mockContext as any, productId);

      // Assert
      expect(result.totalQuantity).toBe(100);
      expect(result.availableQuantity).toBe(90);
    });

    it("should throw error when product not found", async () => {
      // Arrange
      (mockProductRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStock(mockContext as any, "nonexistent")).rejects.toThrow(
        "Producto no encontrado"
      );
    });
  });

  describe("getStockHistory", () => {
    it("should return movements for product", async () => {
      // Arrange
      const productId = "product-1";
      const options = {
        productId,
        limit: 10,
        offset: 0,
      };

      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });
      
      (mockInventoryRepository.getMovements as jest.Mock).mockResolvedValue([
        { id: "mov-1", productId: "product-1", quantity: 10, reason: "purchase" },
        { id: "mov-2", productId: "product-1", quantity: -5, reason: "sale" },
      ]);

      // Act
      const result = await service.getStockHistory(mockContext as any, options);

      // Assert
      expect(result).toHaveLength(2);
    });

    it("should throw error when product not found", async () => {
      // Arrange
      (mockProductRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.getStockHistory(mockContext as any, { productId: "nonexistent" })
      ).rejects.toThrow("Producto no encontrado");
    });

    it("should return all movements when no productId provided", async () => {
      // Arrange
      (mockInventoryRepository.getAllMovements as jest.Mock).mockResolvedValue([
        { id: "mov-1", productId: "product-1" },
      ]);

      // Act
      const result = await service.getStockHistory(mockContext as any, {});

      // Assert
      expect(result).toHaveLength(1);
    });
  });

  describe("checkLowStock", () => {
    it("should return low stock items", async () => {
      // Arrange
      (mockInventoryRepository.getLowStockItems as jest.Mock).mockResolvedValue([
        { productId: "product-1", quantity: 2, minStock: 5, location: "default" },
      ]);
      
      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
        sku: "SHA-001",
      });

      // Act
      const result = await service.checkLowStock(mockContext as any);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].currentStock).toBe(2);
      expect(result[0].minStock).toBe(5);
    });

    it("should accept location filter", async () => {
      // Arrange
      const options = { location: "warehouse" };
      
      (mockInventoryRepository.getLowStockItems as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.checkLowStock(mockContext as any, options);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe("getInventoryValue", () => {
    it("should return total inventory value", async () => {
      // Arrange
      (mockInventoryRepository.getInventoryValue as jest.Mock).mockResolvedValue({
        totalValue: 50000,
        totalItems: 100,
        byCategory: [],
      });

      // Act
      const result = await service.getInventoryValue(mockContext as any);

      // Assert
      expect(result.totalValue).toBe(50000);
      expect(result.totalItems).toBe(100);
    });
  });

  describe("getInventoryItem", () => {
    it("should return inventory item for product", async () => {
      // Arrange
      const productId = "product-1";
      
      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });
      
      (mockInventoryRepository.findByProductId as jest.Mock).mockResolvedValue({
        id: "inv-1",
        productId: "product-1",
        quantity: 50,
      });

      // Act
      const result = await service.getInventoryItem(mockContext as any, productId);

      // Assert
      expect(result).toBeDefined();
      expect(result?.quantity).toBe(50);
    });

    it("should throw error when product not found", async () => {
      // Arrange
      (mockProductRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.getInventoryItem(mockContext as any, "nonexistent")).rejects.toThrow(
        "Producto no encontrado"
      );
    });

    it("should return null when inventory item not found", async () => {
      // Arrange
      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });
      
      (mockInventoryRepository.findByProductId as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getInventoryItem(mockContext as any, "product-1");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("getAllInventoryItems", () => {
    it("should return all inventory items for profile", async () => {
      // Arrange
      (mockInventoryRepository.findByProfileId as jest.Mock).mockResolvedValue([
        { id: "inv-1", productId: "product-1", quantity: 50 },
        { id: "inv-2", productId: "product-2", quantity: 30 },
      ]);

      // Act
      const result = await service.getAllInventoryItems(mockContext as any);

      // Assert
      expect(result).toHaveLength(2);
    });

    it("should accept location filter", async () => {
      // Arrange
      const options = { location: "warehouse", limit: 10, offset: 0 };
      
      (mockInventoryRepository.findByProfileId as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await service.getAllInventoryItems(mockContext as any, options);

      // Assert
      expect(result).toHaveLength(0);
    });
  });

  describe("reserveStock", () => {
    it("should reserve stock when sufficient available", async () => {
      // Arrange
      const productId = "product-1";
      const quantity = 5;
      
      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });
      
      (mockInventoryRepository.getStock as jest.Mock).mockResolvedValue({
        totalQuantity: 50,
        totalReserved: 0,
        availableQuantity: 50,
      });
      
      (mockInventoryRepository.findByProductId as jest.Mock).mockResolvedValue({
        id: "inv-1",
        productId: "product-1",
        quantity: 50,
      });
      
      (mockInventoryRepository.adjustStock as jest.Mock).mockResolvedValue({
        inventoryItem: { id: "inv-1" },
        movement: { id: "mov-1" },
      });

      // Act
      const result = await service.reserveStock(mockContext as any, productId, quantity);

      // Assert
      expect(result).toBeDefined();
    });

    it("should throw error when product not found", async () => {
      // Arrange
      (mockProductRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.reserveStock(mockContext as any, "nonexistent", 5)
      ).rejects.toThrow("Producto no encontrado");
    });

    it("should throw error when insufficient stock", async () => {
      // Arrange
      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
      });
      
      (mockInventoryRepository.getStock as jest.Mock).mockResolvedValue({
        totalQuantity: 3,
        totalReserved: 0,
        availableQuantity: 3,
      });

      // Act & Assert
      await expect(
        service.reserveStock(mockContext as any, "product-1", 10)
      ).rejects.toThrow("Stock insuficiente");
    });
  });

  describe("getStockDirect (for AI tools)", () => {
    it("should return stock by productId and profileId", async () => {
      // Arrange
      (mockInventoryRepository.getStockDirect as jest.Mock).mockResolvedValue({
        totalQuantity: 100,
        totalReserved: 10,
        availableQuantity: 90,
      });

      // Act
      const result = await service.getStockDirect("product-1", "profile-123");

      // Assert
      expect(result.totalQuantity).toBe(100);
      expect(result.availableQuantity).toBe(90);
    });
  });

  describe("adjustStockDirect (for AI tools)", () => {
    it("should adjust stock with valid data", async () => {
      // Arrange
      (mockInventoryRepository.adjustStockDirect as jest.Mock).mockResolvedValue({
        inventoryItem: { id: "inv-1", productId: "product-1", quantity: 20 },
        movement: { id: "mov-1", productId: "product-1", quantity: 10 },
      });

      // Act
      const result = await service.adjustStockDirect(
        "product-1",
        "profile-123",
        10,
        "purchase"
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.inventoryItem.quantity).toBe(20);
    });

    it("should throw error for invalid reason", async () => {
      // Act & Assert
      await expect(
        service.adjustStockDirect("product-1", "profile-123", 10, "invalid" as any)
      ).rejects.toThrow("Razón de movimiento inválida");
    });

    it("should throw error when insufficient stock for negative adjustment", async () => {
      // Arrange
      (mockInventoryRepository.getStockDirect as jest.Mock).mockResolvedValue({
        totalQuantity: 3,
        totalReserved: 0,
        availableQuantity: 3,
      });

      // Act & Assert
      await expect(
        service.adjustStockDirect("product-1", "profile-123", -10, "sale")
      ).rejects.toThrow("Stock insuficiente");
    });
  });

  describe("getLowStockItemsForProfile (for AI tools)", () => {
    it("should return low stock items by profileId", async () => {
      // Arrange
      (mockInventoryRepository.getLowStockItemsWithProduct as jest.Mock).mockResolvedValue([
        {
          productId: "product-1",
          quantity: 2,
          minStock: 5,
          location: "default",
          product: { name: "Shampoo", sku: "SHA-001" },
        },
      ]);

      // Act
      const result = await service.getLowStockItemsForProfile("profile-123");

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].currentStock).toBe(2);
    });
  });

  describe("getInventoryValueForProfile (for AI tools)", () => {
    it("should return inventory value by profileId", async () => {
      // Act
      const result = await service.getInventoryValueForProfile("profile-123");

      // Assert
      expect(result).toBeDefined();
      expect(result.totalValue).toBeDefined();
    });
  });
});
