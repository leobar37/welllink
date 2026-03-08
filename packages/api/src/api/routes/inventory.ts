import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(authGuard)
  // ========================================
  // PRODUCTS
  // ========================================
  
  // List products with search and filters
  .get("/products", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      // Get user's primary profile
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      const primaryProfile = profiles[0];
      
      return services.productService.searchProducts(ctx!, {
        searchTerm: query.searchTerm as string | undefined,
        categoryId: query.categoryId as string | undefined,
        supplierId: query.supplierId as string | undefined,
        isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
        limit: query.limit ? parseInt(query.limit as string) : undefined,
        offset: query.offset ? parseInt(query.offset as string) : undefined,
        profileId: primaryProfile.id,
      });
    }
    
    return services.productService.searchProducts(ctx!, {
      searchTerm: query.searchTerm as string | undefined,
      categoryId: query.categoryId as string | undefined,
      supplierId: query.supplierId as string | undefined,
      isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
      limit: query.limit ? parseInt(query.limit as string) : undefined,
      offset: query.offset ? parseInt(query.offset as string) : undefined,
      profileId,
    });
  })
  
  // Get single product
  .get("/products/:id", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      return services.productService.getProduct(ctx!, params.id, profiles[0].id);
    }
    return services.productService.getProduct(ctx!, params.id, profileId);
  })
  
  // Create product
  .post(
    "/products",
    async ({ body, set, services, ctx }) => {
      const profileId = body.profileId as string;
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        body.profileId = profiles[0].id;
      }
      
      const product = await services.productService.createProduct(ctx!, {
        ...body,
        price: Number(body.price),
        cost: body.cost ? Number(body.cost) : undefined,
      } as any);
      set.status = 201;
      return product;
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        sku: t.String({ minLength: 1 }),
        name: t.String({ minLength: 1 }),
        description: t.Optional(t.String()),
        price: t.Union([t.Number(), t.String()]),
        cost: t.Optional(t.Union([t.Number(), t.String()])),
        unit: t.Optional(t.String()),
        minStock: t.Optional(t.Number()),
        categoryId: t.Optional(t.String()),
        supplierId: t.Optional(t.String()),
        barcode: t.Optional(t.String()),
        hasExpiration: t.Optional(t.Boolean()),
        expirationDays: t.Optional(t.Number()),
        brand: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        initialStock: t.Optional(t.Number()),
        location: t.Optional(t.String()),
      }),
    },
  )
  
  // Update product
  .put(
    "/products/:id",
    async ({ params, body, query, services, ctx }) => {
      const profileId = query.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      return services.productService.updateProduct(ctx!, params.id, targetProfileId, body);
    },
    {
      body: t.Object({
        sku: t.Optional(t.String({ minLength: 1 })),
        name: t.Optional(t.String({ minLength: 1 })),
        description: t.Optional(t.String()),
        price: t.Optional(t.Union([t.Number(), t.String()])),
        cost: t.Optional(t.Union([t.Number(), t.String()])),
        unit: t.Optional(t.String()),
        minStock: t.Optional(t.Number()),
        categoryId: t.Optional(t.String()),
        supplierId: t.Optional(t.String()),
        barcode: t.Optional(t.String()),
        hasExpiration: t.Optional(t.Boolean()),
        expirationDays: t.Optional(t.Number()),
        brand: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  
  // Delete product (soft delete)
  .delete("/products/:id", async ({ params, query, services, ctx, set }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    await services.productService.deleteProduct(ctx!, params.id, targetProfileId);
    set.status = 204;
  })
  
  // Get product by SKU
  .get("/products/sku/:sku", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.productService.getProductBySku(ctx!, params.sku, targetProfileId);
  })
  
  // ========================================
  // STOCK ADJUSTMENT
  // ========================================
  
  // Adjust stock
  .post(
    "/adjust",
    async ({ body, set, services, ctx }) => {
      const profileId = body.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      const result = await services.inventoryService.adjustStockDirect(
        body.productId,
        targetProfileId,
        body.quantity,
        body.reason,
        {
          location: body.location,
          userId: ctx!.userId,
          notes: body.notes,
          referenceType: body.referenceType,
          referenceId: body.referenceId,
        }
      );
      
      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        productId: t.String({ minLength: 1 }),
        quantity: t.Number(),
        reason: t.Union([
          t.Literal("purchase"),
          t.Literal("sale"),
          t.Literal("damage"),
          t.Literal("return"),
          t.Literal("adjustment"),
          t.Literal("initial"),
          t.Literal("transfer"),
          t.Literal("expired"),
        ]),
        location: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        referenceType: t.Optional(t.String()),
        referenceId: t.Optional(t.String()),
      }),
    },
  )
  
  // Get stock for a product
  .get("/stock/:productId", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.inventoryService.getStockDirect(params.productId, targetProfileId);
  })
  
  // Get low stock products
  .get("/low-stock", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.productService.getLowStockProducts(targetProfileId, {
      location: query.location as string | undefined,
      limit: query.limit ? parseInt(query.limit as string) : undefined,
      offset: query.offset ? parseInt(query.offset as string) : undefined,
    });
  })
  
  // ========================================
  // STOCK MOVEMENTS / HISTORY
  // ========================================
  
  // Get stock movements
  .get("/movements", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.inventoryService.getStockHistory(ctx!, {
      productId: query.productId as string | undefined,
      limit: query.limit ? parseInt(query.limit as string) : undefined,
      offset: query.offset ? parseInt(query.offset as string) : undefined,
      reason: query.reason as any,
      startDate: query.startDate ? new Date(query.startDate as string) : undefined,
      endDate: query.endDate ? new Date(query.endDate as string) : undefined,
    });
  })
  
  // Get movement for a specific product
  .get("/movements/:productId", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.inventoryService.getStockHistory(ctx!, {
      productId: params.productId,
      limit: query.limit ? parseInt(query.limit as string) : undefined,
      offset: query.offset ? parseInt(query.offset as string) : undefined,
      reason: query.reason as any,
      startDate: query.startDate ? new Date(query.startDate as string) : undefined,
      endDate: query.endDate ? new Date(query.endDate as string) : undefined,
    });
  })
  
  // ========================================
  // SUPPLIERS
  // ========================================
  
  // List suppliers
  .get("/suppliers", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.supplierRepository.findByProfileIdDirect(targetProfileId, {
      limit: query.limit ? parseInt(query.limit as string) : undefined,
      offset: query.offset ? parseInt(query.offset as string) : undefined,
      isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
    });
  })
  
  // Get single supplier
  .get("/suppliers/:id", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    const supplier = await services.supplierRepository.findByIdAndProfile(params.id, targetProfileId);
    if (!supplier) {
      throw new Error("Proveedor no encontrado");
    }
    return supplier;
  })
  
  // Create supplier
  .post(
    "/suppliers",
    async ({ body, set, services, ctx }) => {
      const profileId = body.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      const supplier = await services.supplierRepository.create({
        profileId: targetProfileId,
        name: body.name,
        contactPerson: body.contactPerson,
        email: body.email,
        phone: body.phone,
        address: body.address,
        taxId: body.rfc,
        paymentTerms: body.paymentTerms,
        notes: body.notes,
        isActive: true,
      });
      
      set.status = 201;
      return supplier;
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        name: t.String({ minLength: 1 }),
        contactPerson: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(t.String()),
        rfc: t.Optional(t.String()),
        paymentTerms: t.Optional(t.String()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  
  // Update supplier
  .put(
    "/suppliers/:id",
    async ({ params, body, query, services, ctx }) => {
      const profileId = query.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      return services.supplierRepository.updateByIdAndProfile(params.id, targetProfileId, body);
    },
    {
      body: t.Object({
        name: t.Optional(t.String({ minLength: 1 })),
        contactPerson: t.Optional(t.String()),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(t.String()),
        rfc: t.Optional(t.String()),
        paymentTerms: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )
  
  // Delete supplier (soft delete)
  .delete("/suppliers/:id", async ({ params, query, services, ctx, set }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    await services.supplierRepository.updateByIdAndProfile(params.id, targetProfileId, { isActive: false });
    set.status = 204;
  })
  
  // ========================================
  // INVENTORY VALUE
  // ========================================
  
  // Get inventory value
  .get("/value", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return { totalValue: 0, totalItems: 0, byCategory: [] };
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.inventoryService.getInventoryValueForProfile(targetProfileId);
  })
  
  // ========================================
  // SUPPLIER-PRODUCT ASSOCIATIONS
  // ========================================
  
  // Get products for a supplier
  .get("/suppliers/:supplierId/products", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.supplierProductService.getProductsBySupplier(
      ctx!,
      targetProfileId,
      params.supplierId,
      {
        limit: query.limit ? parseInt(query.limit as string) : undefined,
        offset: query.offset ? parseInt(query.offset as string) : undefined,
        isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
      }
    );
  })
  
  // Get suppliers for a product
  .get("/products/:productId/suppliers", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.supplierProductService.getSuppliersByProduct(
      ctx!,
      targetProfileId,
      params.productId,
      {
        limit: query.limit ? parseInt(query.limit as string) : undefined,
        offset: query.offset ? parseInt(query.offset as string) : undefined,
        isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
      }
    );
  })
  
  // Get single supplier-product association
  .get("/supplier-products/:id", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    const supplierProduct = await services.supplierProductService.getSupplierProduct(
      ctx!,
      targetProfileId,
      params.id
    );
    
    if (!supplierProduct) {
      throw new Error("Asociación de proveedor-producto no encontrada");
    }
    
    return supplierProduct;
  })
  
  // Create supplier-product association
  .post(
    "/supplier-products",
    async ({ body, set, services, ctx }) => {
      const profileId = body.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      const supplierProduct = await services.supplierProductService.createSupplierProduct(
        ctx!,
        targetProfileId,
        {
          supplierId: body.supplierId,
          productId: body.productId,
          supplierSku: body.supplierSku,
          costPrice: body.costPrice,
          leadTimeDays: body.leadTimeDays,
          minOrderQty: body.minOrderQty,
          isPrimary: body.isPrimary,
          notes: body.notes,
        }
      );
      
      set.status = 201;
      return supplierProduct;
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        supplierId: t.String({ minLength: 1 }),
        productId: t.String({ minLength: 1 }),
        supplierSku: t.Optional(t.String()),
        costPrice: t.Optional(t.Union([t.Number(), t.String()])),
        leadTimeDays: t.Optional(t.Number()),
        minOrderQty: t.Optional(t.Number()),
        isPrimary: t.Optional(t.Boolean()),
        notes: t.Optional(t.String()),
      }),
    },
  )
  
  // Update supplier-product association
  .put(
    "/supplier-products/:id",
    async ({ params, body, query, services, ctx }) => {
      const profileId = query.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      return services.supplierProductService.updateSupplierProduct(
        ctx!,
        targetProfileId,
        params.id,
        body
      );
    },
    {
      body: t.Object({
        supplierSku: t.Optional(t.String()),
        costPrice: t.Optional(t.Union([t.Number(), t.String()])),
        leadTimeDays: t.Optional(t.Number()),
        minOrderQty: t.Optional(t.Number()),
        isPrimary: t.Optional(t.Boolean()),
        notes: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
      }),
    },
  )
  
  // Delete supplier-product association
  .delete("/supplier-products/:id", async ({ params, query, services, ctx, set }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    await services.supplierProductService.deleteSupplierProduct(
      ctx!,
      targetProfileId,
      params.id
    );
    set.status = 204;
  })
  
  // Set supplier-product as primary
  .post(
    "/supplier-products/:id/set-primary",
    async ({ params, query, services, ctx }) => {
      const profileId = query.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      return services.supplierProductService.setAsPrimary(
        ctx!,
        targetProfileId,
        params.id
      );
    },
  )
  
  // Get primary supplier for a product
  .get("/products/:productId/primary-supplier", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return null;
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.supplierProductService.getPrimarySupplier(
      ctx!,
      targetProfileId,
      params.productId
    );
  })
  
  // ========================================
  // PURCHASE ORDERS
  // ========================================
  
  // List purchase orders
  .get("/purchase-orders", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return [];
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.purchaseOrderService.listPurchaseOrders(targetProfileId, {
      limit: query.limit ? parseInt(query.limit as string) : undefined,
      offset: query.offset ? parseInt(query.offset as string) : undefined,
      status: query.status as any,
      supplierId: query.supplierId as string | undefined,
    });
  })
  
  // Get single purchase order
  .get("/purchase-orders/:id", async ({ params, query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    const po = await services.purchaseOrderService.getPurchaseOrder(
      ctx!,
      params.id,
      targetProfileId
    );
    
    if (!po) {
      throw new Error("Orden de compra no encontrada");
    }
    return po;
  })
  
  // Create purchase order
  .post(
    "/purchase-orders",
    async ({ body, set, services, ctx }) => {
      const profileId = body.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      const po = await services.purchaseOrderService.createPurchaseOrder(
        ctx!,
        {
          profileId: targetProfileId,
          supplierId: body.supplierId,
          orderNumber: body.orderNumber,
          expectedDate: body.expectedDate,
          notes: body.notes,
          items: body.items,
        }
      );
      
      set.status = 201;
      return po;
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        supplierId: t.String({ minLength: 1 }),
        orderNumber: t.Optional(t.String()),
        expectedDate: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        items: t.Array(t.Object({
          productId: t.String({ minLength: 1 }),
          quantity: t.Number({ minimum: 1 }),
          unitPrice: t.Union([t.Number(), t.String()]),
          notes: t.Optional(t.String()),
        })),
      }),
    },
  )
  
  // Update purchase order
  .put(
    "/purchase-orders/:id",
    async ({ params, body, query, services, ctx }) => {
      const profileId = query.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      return services.purchaseOrderService.updatePurchaseOrder(
        ctx!,
        params.id,
        targetProfileId,
        body
      );
    },
    {
      body: t.Object({
        supplierId: t.Optional(t.String()),
        orderNumber: t.Optional(t.String()),
        expectedDate: t.Optional(t.String()),
        notes: t.Optional(t.String()),
        tax: t.Optional(t.Union([t.Number(), t.String()])),
      }),
    },
  )
  
  // Delete purchase order (only draft)
  .delete("/purchase-orders/:id", async ({ params, query, services, ctx, set }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    await services.purchaseOrderService.deletePurchaseOrder(
      ctx!,
      params.id,
      targetProfileId
    );
    set.status = 204;
  })
  
  // Send purchase order (draft -> sent)
  .post(
    "/purchase-orders/:id/send",
    async ({ params, query, services, ctx }) => {
      const profileId = query.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      return services.purchaseOrderService.sendPurchaseOrder(
        ctx!,
        params.id,
        targetProfileId
      );
    },
  )
  
  // Receive purchase order (sent/partial -> partial/received)
  .post(
    "/purchase-orders/:id/receive",
    async ({ params, body, query, services, ctx, set }) => {
      const profileId = query.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      const result = await services.purchaseOrderService.receivePurchaseOrder(
        ctx!,
        params.id,
        targetProfileId,
        body
      );
      
      return result;
    },
    {
      body: t.Object({
        items: t.Array(t.Object({
          productId: t.String({ minLength: 1 }),
          quantity: t.Number({ minimum: 1 }),
          location: t.Optional(t.String()),
          notes: t.Optional(t.String()),
        })),
      }),
    },
  )
  
  // Cancel purchase order
  .post(
    "/purchase-orders/:id/cancel",
    async ({ params, body, query, services, ctx }) => {
      const profileId = query.profileId as string;
      let targetProfileId: string;
      
      if (!profileId) {
        const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
        if (profiles.length === 0) {
          throw new Error("Perfil no encontrado");
        }
        targetProfileId = profiles[0].id;
      } else {
        targetProfileId = profileId;
      }
      
      return services.purchaseOrderService.cancelPurchaseOrder(
        ctx!,
        params.id,
        targetProfileId,
        body.reason
      );
    },
    {
      body: t.Object({
        reason: t.String({ minLength: 1 }),
      }),
    },
  )

  
  // ========================================
  // REPORTS
  // ========================================
  
  // Get inventory rotation report
  .get("/reports/rotation", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return { items: [], summary: { totalProducts: 0, averageRotationRate: 0, totalConsumed: 0, totalPurchased: 0 }, filters: {} };
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.reportService.getInventoryRotation(targetProfileId, {
      startDate: query.startDate ? new Date(query.startDate as string) : undefined,
      endDate: query.endDate ? new Date(query.endDate as string) : undefined,
      categoryId: query.categoryId as string | undefined,
      location: query.location as string | undefined,
    });
  })
  
  // Get stock valuation report
  .get("/reports/valuation", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return { totalValue: 0, totalItems: 0, byCategory: [], filters: {} };
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    return services.reportService.getStockValuation(targetProfileId, {
      startDate: query.startDate ? new Date(query.startDate as string) : undefined,
      endDate: query.endDate ? new Date(query.endDate as string) : undefined,
      categoryId: query.categoryId as string | undefined,
      location: query.location as string | undefined,
    });
  })
  
  // Get top consumed products report
  .get("/reports/consumed", async ({ query, services, ctx }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        return { items: [], summary: { totalProducts: 0, totalQuantity: 0, totalValue: 0 }, filters: {} };
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    const limit = query.limit ? parseInt(query.limit as string) : 10;
    
    return services.reportService.getTopConsumedProducts(targetProfileId, {
      startDate: query.startDate ? new Date(query.startDate as string) : undefined,
      endDate: query.endDate ? new Date(query.endDate as string) : undefined,
      categoryId: query.categoryId as string | undefined,
      location: query.location as string | undefined,
    }, limit);
  })
  
  // Export report to Excel
  .get("/reports/export/xlsx", async ({ query, services, ctx, set }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    const reportType = query.type as "rotation" | "valuation" | "consumed";
    if (!["rotation", "valuation", "consumed"].includes(reportType)) {
      throw new Error("Tipo de reporte inválido. Use: rotation, valuation, o consumed");
    }
    
    const buffer = await services.reportService.exportToExcel(
      reportType,
      targetProfileId,
      {
        startDate: query.startDate ? new Date(query.startDate as string) : undefined,
        endDate: query.endDate ? new Date(query.endDate as string) : undefined,
        categoryId: query.categoryId as string | undefined,
        location: query.location as string | undefined,
      },
      { title: query.title as string }
    );
    
    set.headers["Content-Type"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    set.headers["Content-Disposition"] = `attachment; filename="reporte-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx"`;
    
    return buffer;
  })
  
  // Export report to PDF
  .get("/reports/export/pdf", async ({ query, services, ctx, set }) => {
    const profileId = query.profileId as string;
    let targetProfileId: string;
    
    if (!profileId) {
      const profiles = await services.profileRepository.findByUser(ctx!, ctx!.userId);
      if (profiles.length === 0) {
        throw new Error("Perfil no encontrado");
      }
      targetProfileId = profiles[0].id;
    } else {
      targetProfileId = profileId;
    }
    
    const reportType = query.type as "rotation" | "valuation" | "consumed";
    if (!["rotation", "valuation", "consumed"].includes(reportType)) {
      throw new Error("Tipo de reporte inválido. Use: rotation, valuation, o consumed");
    }
    
    const buffer = await services.reportService.exportToPdf(
      reportType,
      targetProfileId,
      {
        startDate: query.startDate ? new Date(query.startDate as string) : undefined,
        endDate: query.endDate ? new Date(query.endDate as string) : undefined,
        categoryId: query.categoryId as string | undefined,
        location: query.location as string | undefined,
      },
      { title: query.title as string }
    );
    
    set.headers["Content-Type"] = "application/pdf";
    set.headers["Content-Disposition"] = `attachment; filename="reporte-${reportType}-${new Date().toISOString().split('T')[0]}.pdf"`;
    
    return buffer;
  });
