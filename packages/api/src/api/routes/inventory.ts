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
  });
