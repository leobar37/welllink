import { describe, it, expect, beforeEach, jest } from "bun:test";
import { PurchaseOrderService, CreatePurchaseOrderDTO, ReceivePurchaseOrderDTO } from "./purchase-order";
import type { PurchaseOrderRepository } from "../repository/purchase-order";
import type { InventoryRepository } from "../repository/inventory";
import type { ProductRepository } from "../repository/product";
import type { SupplierRepository } from "../repository/supplier";

// Mock the dependencies
const mockPurchaseOrderRepository: Partial<PurchaseOrderRepository> = {
  createWithItems: jest.fn(),
  findById: jest.fn(),
  findByIdAndProfile: jest.fn(),
  findByProfileId: jest.fn(),
  findItemById: jest.fn(),
  findItemsByOrderId: jest.fn(),
  update: jest.fn(),
  updateStatus: jest.fn(),
  updateItem: jest.fn(),
  updateItemReceivedQuantity: jest.fn(),
  recalculateTotal: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

const mockInventoryRepository: Partial<InventoryRepository> = {
  adjustStockDirect: jest.fn(),
  getStockDirect: jest.fn(),
};

const mockProductRepository: Partial<ProductRepository> = {
  findById: jest.fn(),
  findByIdAndProfile: jest.fn(),
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

const mockContext = {
  userId: "user-123",
  profileId: "profile-123",
};

describe("PurchaseOrderService", () => {
  let service: PurchaseOrderService;

  beforeEach(() => {
    jest.clearAllMocks();
    
    service = new PurchaseOrderService(
      mockPurchaseOrderRepository as PurchaseOrderRepository,
      mockInventoryRepository as InventoryRepository,
      mockProductRepository as ProductRepository,
      mockSupplierRepository as SupplierRepository,
    );
  });

  describe("createPurchaseOrder", () => {
    it("should create purchase order with valid data", async () => {
      // Arrange
      const dto: CreatePurchaseOrderDTO = {
        profileId: "profile-123",
        supplierId: "supplier-1",
        orderNumber: "OC-001",
        notes: "Test order",
        items: [
          {
            productId: "product-1",
            quantity: 10,
            unitPrice: 100,
          },
        ],
      };

      (mockSupplierRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "supplier-1",
        name: "Proveedor Test",
      });
      
      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
        profileId: "profile-123",
      });
      
      (mockPurchaseOrderRepository.createWithItems as jest.Mock).mockResolvedValue({
        purchaseOrder: {
          id: "po-1",
          profileId: "profile-123",
          supplierId: "supplier-1",
          status: "draft",
          total: "1000",
        },
        items: [
          {
            id: "item-1",
            productId: "product-1",
            quantity: 10,
            unitPrice: "100",
            total: "1000",
          },
        ],
      });

      // Act
      const result = await service.createPurchaseOrder(mockContext as any, dto);

      // Assert
      expect(result).toBeDefined();
      expect(result.id).toBe("po-1");
      expect(result.status).toBe("draft");
    });

    it("should throw error when supplier not found", async () => {
      // Arrange
      const dto: CreatePurchaseOrderDTO = {
        profileId: "profile-123",
        supplierId: "nonexistent",
        items: [{ productId: "product-1", quantity: 10, unitPrice: 100 }],
      };

      (mockSupplierRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.createPurchaseOrder(mockContext as any, dto)).rejects.toThrow(
        "Proveedor no encontrado"
      );
    });

    it("should throw error when product not found", async () => {
      // Arrange
      const dto: CreatePurchaseOrderDTO = {
        profileId: "profile-123",
        supplierId: "supplier-1",
        items: [{ productId: "nonexistent", quantity: 10, unitPrice: 100 }],
      };

      (mockSupplierRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "supplier-1",
        name: "Proveedor Test",
      });
      
      (mockProductRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.createPurchaseOrder(mockContext as any, dto)).rejects.toThrow(
        "Producto no encontrado"
      );
    });

    it("should throw error when product belongs to different profile", async () => {
      // Arrange
      const dto: CreatePurchaseOrderDTO = {
        profileId: "profile-123",
        supplierId: "supplier-1",
        items: [{ productId: "product-1", quantity: 10, unitPrice: 100 }],
      };

      (mockSupplierRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "supplier-1",
        name: "Proveedor Test",
      });
      
      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
        profileId: "different-profile",
      });

      // Act & Assert
      await expect(service.createPurchaseOrder(mockContext as any, dto)).rejects.toThrow(
        "no pertenece a este perfil"
      );
    });

    it("should throw error when quantity is not positive", async () => {
      // Arrange
      const dto: CreatePurchaseOrderDTO = {
        profileId: "profile-123",
        supplierId: "supplier-1",
        items: [{ productId: "product-1", quantity: 0, unitPrice: 100 }],
      };

      (mockSupplierRepository.findByIdAndProfile as jest.Mock).mockResolvedValue({
        id: "supplier-1",
        name: "Proveedor Test",
      });
      
      (mockProductRepository.findById as jest.Mock).mockResolvedValue({
        id: "product-1",
        name: "Shampoo",
        profileId: "profile-123",
      });

      // Act & Assert
      await expect(service.createPurchaseOrder(mockContext as any, dto)).rejects.toThrow(
        "cantidad debe ser mayor a 0"
      );
    });
  });

  describe("getPurchaseOrder", () => {
    it("should return purchase order when found", async () => {
      // Arrange
      const mockPO = {
        id: "po-1",
        profileId: "profile-123",
        status: "draft",
        items: [],
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(mockPO);

      // Act
      const result = await service.getPurchaseOrder(mockContext as any, "po-1", "profile-123");

      // Assert
      expect(result).toBeDefined();
      expect(result?.id).toBe("po-1");
    });

    it("should return null when not found", async () => {
      // Arrange
      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act
      const result = await service.getPurchaseOrder(mockContext as any, "nonexistent", "profile-123");

      // Assert
      expect(result).toBeNull();
    });
  });

  describe("listPurchaseOrders", () => {
    it("should return list of purchase orders", async () => {
      // Arrange
      const mockPOs = [
        { id: "po-1", status: "draft" },
        { id: "po-2", status: "sent" },
      ];

      (mockPurchaseOrderRepository.findByProfileId as jest.Mock).mockResolvedValue(mockPOs);

      // Act
      const result = await service.listPurchaseOrders("profile-123");

      // Assert
      expect(result).toHaveLength(2);
    });

    it("should filter by status", async () => {
      // Arrange
      const options = { status: "draft" as const };
      
      (mockPurchaseOrderRepository.findByProfileId as jest.Mock).mockResolvedValue([
        { id: "po-1", status: "draft" },
      ]);

      // Act
      const result = await service.listPurchaseOrders("profile-123", options);

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe("draft");
    });
  });

  describe("updatePurchaseOrder", () => {
    it("should update purchase order when draft", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "draft",
        supplierId: "supplier-1",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.update as jest.Mock).mockResolvedValue({
        ...existingPO,
        notes: "Updated notes",
      });

      // Act
      const result = await service.updatePurchaseOrder(
        mockContext as any,
        "po-1",
        "profile-123",
        { notes: "Updated notes" }
      );

      // Assert
      expect(result).toBeDefined();
    });

    it("should throw error when purchase order not found", async () => {
      // Arrange
      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.updatePurchaseOrder(mockContext as any, "nonexistent", "profile-123", {})
      ).rejects.toThrow("Orden de compra no encontrada");
    });

    it("should throw error when not draft", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "sent",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);

      // Act & Assert
      await expect(
        service.updatePurchaseOrder(mockContext as any, "po-1", "profile-123", {})
      ).rejects.toThrow("borrador");
    });
  });

  describe("sendPurchaseOrder", () => {
    it("should send purchase order when draft", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "draft",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.findItemsByOrderId as jest.Mock).mockResolvedValue([
        { id: "item-1" },
      ]);
      
      (mockPurchaseOrderRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...existingPO,
        status: "sent",
      });

      // Act
      const result = await service.sendPurchaseOrder(mockContext as any, "po-1", "profile-123");

      // Assert
      expect(result.status).toBe("sent");
    });

    it("should throw error when purchase order not found", async () => {
      // Arrange
      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.sendPurchaseOrder(mockContext as any, "nonexistent", "profile-123")
      ).rejects.toThrow("Orden de compra no encontrada");
    });

    it("should throw error when not draft", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "received",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);

      // Act & Assert
      await expect(
        service.sendPurchaseOrder(mockContext as any, "po-1", "profile-123")
      ).rejects.toThrow("borrador");
    });

    it("should throw error when no items", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "draft",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.findItemsByOrderId as jest.Mock).mockResolvedValue([]);

      // Act & Assert
      await expect(
        service.sendPurchaseOrder(mockContext as any, "po-1", "profile-123")
      ).rejects.toThrow("al menos un artículo");
    });
  });

  describe("receivePurchaseOrder", () => {
    it("should receive items and update inventory", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "sent",
        orderNumber: "OC-001",
      };

      const orderItems = [
        {
          id: "item-1",
          productId: "product-1",
          quantity: 10,
          receivedQuantity: 0,
        },
      ];

      const dto: ReceivePurchaseOrderDTO = {
        items: [
          {
            productId: "product-1",
            quantity: 5,
          },
        ],
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.findItemsByOrderId as jest.Mock)
        .mockResolvedValueOnce(orderItems)
        .mockResolvedValueOnce([
          { ...orderItems[0], receivedQuantity: 5 },
        ]);
      
      (mockInventoryRepository.adjustStockDirect as jest.Mock).mockResolvedValue({
        inventoryItem: { id: "inv-1" },
        movement: { id: "mov-1" },
      });
      
      (mockPurchaseOrderRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...existingPO,
        status: "partial",
      });

      // Act
      const result = await service.receivePurchaseOrder(
        mockContext as any,
        "po-1",
        "profile-123",
        dto
      );

      // Assert
      expect(result).toBeDefined();
      expect(result.purchaseOrder.status).toBe("partial");
    });

    it("should throw error when purchase order not found", async () => {
      // Arrange
      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.receivePurchaseOrder(mockContext as any, "nonexistent", "profile-123", { items: [] })
      ).rejects.toThrow("Orden de compra no encontrada");
    });

    it("should throw error when not sent or partial", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "draft",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);

      // Act & Assert
      await expect(
        service.receivePurchaseOrder(mockContext as any, "po-1", "profile-123", { items: [] })
      ).rejects.toThrow("enviadas o parcialmente");
    });

    it("should throw error when item not in order", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "sent",
      };

      const dto: ReceivePurchaseOrderDTO = {
        items: [
          {
            productId: "product-not-in-order",
            quantity: 5,
          },
        ],
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.findItemsByOrderId as jest.Mock).mockResolvedValue([
        { productId: "product-1", quantity: 10, receivedQuantity: 0 },
      ]);

      // Act & Assert
      await expect(
        service.receivePurchaseOrder(mockContext as any, "po-1", "profile-123", dto)
      ).rejects.toThrow("no está en esta orden de compra");
    });

    it("should throw error when receiving more than remaining", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "sent",
      };

      const dto: ReceivePurchaseOrderDTO = {
        items: [
          {
            productId: "product-1",
            quantity: 15,
          },
        ],
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.findItemsByOrderId as jest.Mock).mockResolvedValue([
        { productId: "product-1", quantity: 10, receivedQuantity: 0 },
      ]);

      // Act & Assert
      await expect(
        service.receivePurchaseOrder(mockContext as any, "po-1", "profile-123", dto)
      ).rejects.toThrow("Cantidad maxima");
    });
  });

  describe("cancelPurchaseOrder", () => {
    it("should cancel draft purchase order", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "draft",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.findItemsByOrderId as jest.Mock).mockResolvedValue([]);
      
      (mockPurchaseOrderRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...existingPO,
        status: "cancelled",
      });

      // Act
      const result = await service.cancelPurchaseOrder(
        mockContext as any,
        "po-1",
        "profile-123",
        "Reason for cancellation"
      );

      // Assert
      expect(result.status).toBe("cancelled");
    });

    it("should cancel sent purchase order", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "sent",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.findItemsByOrderId as jest.Mock).mockResolvedValue([
        { receivedQuantity: 0 },
      ]);
      
      (mockPurchaseOrderRepository.updateStatus as jest.Mock).mockResolvedValue({
        ...existingPO,
        status: "cancelled",
      });

      // Act
      const result = await service.cancelPurchaseOrder(
        mockContext as any,
        "po-1",
        "profile-123",
        "Reason"
      );

      // Assert
      expect(result.status).toBe("cancelled");
    });

    it("should throw error when already partially received", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "sent",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.findItemsByOrderId as jest.Mock).mockResolvedValue([
        { receivedQuantity: 5 },
      ]);

      // Act & Assert
      await expect(
        service.cancelPurchaseOrder(mockContext as any, "po-1", "profile-123", "Reason")
      ).rejects.toThrow("ya ha sido recibida");
    });
  });

  describe("deletePurchaseOrder", () => {
    it("should delete draft purchase order", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "draft",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);
      
      (mockPurchaseOrderRepository.delete as jest.Mock).mockResolvedValue(existingPO);

      // Act
      await service.deletePurchaseOrder(mockContext as any, "po-1", "profile-123");

      // Assert
      expect(mockPurchaseOrderRepository.delete).toHaveBeenCalled();
    });

    it("should throw error when not draft", async () => {
      // Arrange
      const existingPO = {
        id: "po-1",
        status: "sent",
      };

      (mockPurchaseOrderRepository.findByIdAndProfile as jest.Mock).mockResolvedValue(existingPO);

      // Act & Assert
      await expect(
        service.deletePurchaseOrder(mockContext as any, "po-1", "profile-123")
      ).rejects.toThrow("borrador");
    });
  });
});
