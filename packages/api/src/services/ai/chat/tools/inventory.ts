import { createTool } from "@voltagent/core";
import { z } from "zod";
import { ProductRepository } from "../../../../services/repository/product";
import { InventoryRepository } from "../../../../services/repository/inventory";
import type { Product } from "../../../../db/schema/product";

// Instantiate repositories
const productRepository = new ProductRepository();
const inventoryRepository = new InventoryRepository();

// Input schemas
const CheckInventoryInput = z.object({
  profileId: z.string().describe("The profile ID to check inventory for"),
  searchTerm: z
    .string()
    .describe(
      "Product name, SKU, or barcode to search for. Can be partial match."
    ),
  location: z.string().optional().describe("Specific location/warehouse to check"),
});

const GetProductInfoInput = z.object({
  profileId: z.string().describe("The profile ID the product belongs to"),
  productId: z.string().optional().describe("The specific product ID to look up"),
  searchTerm: z
    .string()
    .optional()
    .describe("Product name or SKU to search for (if productId not provided)"),
});

/**
 * Tool: Check Inventory
 * 
 * Queries stock levels by product name, SKU, or barcode.
 * Returns available quantity and stock status.
 */
export const checkInventoryTool = createTool({
  name: "check_inventory",
  description:
    "Check current stock levels for products. Use this when a customer asks about product availability, stock levels, or if a product is in stock. Search by product name, SKU, or barcode. Returns quantity available and whether it's low stock.",
  parameters: CheckInventoryInput,
  execute: async ({ profileId, searchTerm, location }) => {
    try {
      // Search products by name, SKU, or barcode
      const products = await productRepository.searchByNameOrSkuDirect(
        profileId,
        searchTerm
      );

      if (products.length === 0) {
        return {
          success: true,
          found: false,
          message: `No se encontraron productos con "${searchTerm}"`,
          products: [],
        };
      }

      // Get stock for each product
      const productsWithStock = await Promise.all(
        products.map(async (p: Product) => {
          let stockInfo;

          if (location) {
            // Get stock for specific location
            const item = await inventoryRepository.findByProductIdDirect(
              p.id,
              profileId,
              location
            );
            stockInfo = {
              totalQuantity: item?.quantity ?? 0,
              totalReserved: item?.reservedQuantity ?? 0,
              availableQuantity:
                (item?.quantity ?? 0) - (item?.reservedQuantity ?? 0),
            };
          } else {
            // Get total stock across all locations
            stockInfo = await inventoryRepository.getStockDirect(p.id, profileId);
          }

          const isLowStock = stockInfo.availableQuantity <= (p.minStock ?? 0);

          return {
            id: p.id,
            name: p.name,
            sku: p.sku,
            barcode: p.barcode,
            location: location ?? "all",
            stock: {
              available: stockInfo.availableQuantity,
              total: stockInfo.totalQuantity,
              reserved: stockInfo.totalReserved,
            },
            minStock: p.minStock ?? 0,
            isLowStock,
            status: isLowStock
              ? "low_stock"
              : stockInfo.availableQuantity > 0
              ? "in_stock"
              : "out_of_stock",
          };
        })
      );

      // Format response
      const summary = productsWithStock
        .map(
          (p) =>
            `• ${p.name} (SKU: ${p.sku}): ${p.stock.available} unidades${
              p.isLowStock ? " ⚠️ Stock bajo" : ""
            }`
        )
        .join("\n");

      return {
        success: true,
        found: true,
        message: `Productos encontrados:\n${summary}`,
        products: productsWithStock,
      };
    } catch (error) {
      return {
        error: true,
        message: `Error consultando inventario: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  },
});

/**
 * Tool: Get Product Info
 * 
 * Gets detailed product information including price, description,
 * and current availability status.
 */
export const getProductInfoTool = createTool({
  name: "get_product_info",
  description:
    "Get detailed information about a specific product including price, description, and availability. Use this when a customer asks for product details, pricing, or more information about a specific product. Provide either productId OR searchTerm (name/SKU).",
  parameters: GetProductInfoInput,
  execute: async ({ profileId, productId, searchTerm }) => {
    try {
      let product: Product | null | undefined;

      if (productId) {
        // Get by ID
        product = await productRepository.findByIdAndProfile(productId, profileId);
      } else if (searchTerm) {
        // Search by name/SKU
        const products = await productRepository.searchByNameOrSkuDirect(
          profileId,
          searchTerm
        );
        product = products[0]; // Return first match
      } else {
        return {
          error: true,
          message: "Debe proporcionar productId o searchTerm",
        };
      }

      if (!product) {
        return {
          error: true,
          message: "Producto no encontrado",
        };
      }

      // Get stock information
      const stockInfo = await inventoryRepository.getStockDirect(
        product.id,
        profileId
      );

      const isLowStock = stockInfo.availableQuantity <= (product.minStock ?? 0);

      // Format price
      const price =
        product.price && Number(product.price) > 0
          ? `$${Number(product.price).toFixed(2)}`
          : "Consultar";

      // Format cost
      const cost =
        product.cost && Number(product.cost) > 0
          ? `$${Number(product.cost).toFixed(2)}`
          : "No especificado";

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          description: product.description,
          price,
          cost,
          unit: product.unit,
          brand: product.brand,
          categoryId: product.categoryId,
          supplierId: product.supplierId,
          stock: {
            available: stockInfo.availableQuantity,
            total: stockInfo.totalQuantity,
            reserved: stockInfo.totalReserved,
          },
          minStock: product.minStock ?? 0,
          isLowStock,
          hasExpiration: product.hasExpiration,
          expirationDays: product.expirationDays,
          barcode: product.barcode,
          status: isLowStock
            ? "low_stock"
            : stockInfo.availableQuantity > 0
            ? "in_stock"
            : "out_of_stock",
          message: stockInfo.availableQuantity > 0
            ? `✅ Disponible: ${stockInfo.availableQuantity} unidades`
            : "❌ Agotado",
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error obteniendo información del producto: ${
          error instanceof Error ? error.message : "Error desconocido"
        }`,
      };
    }
  },
});
