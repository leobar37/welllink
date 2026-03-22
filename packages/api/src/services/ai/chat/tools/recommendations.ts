import { createTool } from "@voltagent/core";
import { z } from "zod";
import { ClientRepository } from "../../../../services/repository/client";
import { ReservationRepository } from "../../../../services/repository/reservation";
import { MedicalServiceRepository } from "../../../../services/repository/medical-service";
import { ServiceProductRepository } from "../../../../services/repository/service-product";
import { ProductRepository } from "../../../../services/repository/product";
import { db } from "../../../../db";
import { serviceProduct as serviceProductTable } from "../../../../db/schema/service-product";
import type { MedicalService } from "../../../../db/schema/medical-service";
import type { Client } from "../../../../db/schema/client";
import { eq, and, inArray } from "drizzle-orm";
import { sanitizeErrorMessage } from "../../../../utils/error-sanitizer";

// Instantiate repositories
const clientRepository = new ClientRepository();
const reservationRepository = new ReservationRepository();
const medicalServiceRepository = new MedicalServiceRepository();
const serviceProductRepository = new ServiceProductRepository();
const productRepository = new ProductRepository();

// Types for client history
interface ClientHistoryItem {
  id: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: string | null;
  scheduledAt: string;
  status: string;
  price: number | null;
}

interface ClientHistoryStats {
  totalVisits: number;
  lastVisitDaysAgo: number | null;
  favoriteServices: Array<{
    name: string;
    category: string | null;
    count: number;
  }>;
  usedCategories: string[];
}

interface ClientHistoryResult {
  found: boolean;
  client?: {
    id: string;
    name: string;
    phone: string;
    label: string;
  };
  history: ClientHistoryItem[];
  stats: ClientHistoryStats;
}

// Helper to fetch services by IDs
async function getServicesByIds(
  serviceIds: string[],
): Promise<MedicalService[]> {
  const services: MedicalService[] = [];
  for (const id of serviceIds) {
    const service = await medicalServiceRepository.findById(id);
    if (service) {
      services.push(service);
    }
  }
  return services;
}

/**
 * Get client history (internal helper function)
 */
async function getClientHistoryInternal(
  profileId: string,
  phone: string,
  limit: number = 10,
): Promise<ClientHistoryResult> {
  // First find the client by phone
  const client = await clientRepository.findByPhoneAndProfile(phone, profileId);

  if (!client) {
    return {
      found: false,
      history: [],
      stats: {
        totalVisits: 0,
        lastVisitDaysAgo: null,
        favoriteServices: [],
        usedCategories: [],
      },
    };
  }

  // Get reservations for this client
  const reservations = await reservationRepository.findByPatientPhone(phone);

  // Filter by profile and get most recent
  const profileReservations = reservations
    .filter((r) => r.profileId === profileId)
    .sort(
      (a, b) =>
        new Date(b.scheduledAtUtc).getTime() -
        new Date(a.scheduledAtUtc).getTime(),
    )
    .slice(0, limit);

  // Get service details for each reservation
  const serviceIds = [...new Set(profileReservations.map((r) => r.serviceId))];
  const services =
    serviceIds.length > 0 ? await getServicesByIds(serviceIds) : [];

  const serviceMap = new Map(services.map((s: MedicalService) => [s.id, s]));

  // Build history with service details
  const history: ClientHistoryItem[] = profileReservations.map((res) => {
    const service = serviceMap.get(res.serviceId);
    return {
      id: res.id,
      serviceId: res.serviceId,
      serviceName: service?.name || "Unknown Service",
      serviceCategory: service?.category || null,
      scheduledAt: res.scheduledAtUtc.toISOString(),
      status: res.status,
      price: res.priceAtBooking ? Number(res.priceAtBooking) : null,
    };
  });

  // Calculate statistics
  const completedReservations = profileReservations.filter(
    (r) => r.status === "completed",
  );
  const totalVisits = completedReservations.length;

  // Get most recent completed visit
  const lastCompleted = completedReservations[0];
  let lastVisitDaysAgo: number | null = null;
  if (lastCompleted) {
    const now = new Date();
    const lastDate = new Date(lastCompleted.scheduledAtUtc);
    lastVisitDaysAgo = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  }

  // Find favorite services (most used)
  const serviceCounts = new Map<
    string,
    { name: string; category: string | null; count: number }
  >();
  completedReservations.forEach((res) => {
    const service = serviceMap.get(res.serviceId);
    if (service) {
      const existing = serviceCounts.get(service.id);
      if (existing) {
        existing.count++;
      } else {
        serviceCounts.set(service.id, {
          name: service.name,
          category: service.category || null,
          count: 1,
        });
      }
    }
  });

  const favoriteServices = Array.from(serviceCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Get unique categories the client has used
  const usedCategories = [
    ...new Set(
      completedReservations
        .map((r) => serviceMap.get(r.serviceId)?.category)
        .filter((c): c is string => c !== null && c !== undefined),
    ),
  ];

  return {
    found: true,
    client: {
      id: client.id,
      name: client.name,
      phone: client.phone,
      label: client.label,
    },
    history,
    stats: {
      totalVisits,
      lastVisitDaysAgo,
      favoriteServices,
      usedCategories,
    },
  };
}

// Input schemas
const GetClientHistoryInput = z.object({
  profileId: z.string().describe("The profile ID to look up the client in"),
  phone: z
    .string()
    .describe("Client phone number with country code, e.g., +51987654321"),
  limit: z
    .number()
    .optional()
    .default(10)
    .describe("Maximum number of appointments to return"),
});

const GetServiceRecommendationsInput = z.object({
  profileId: z.string().describe("The profile ID to get recommendations for"),
  phone: z
    .string()
    .describe("Client phone number with country code, e.g., +51987654321"),
  currentServiceId: z
    .string()
    .optional()
    .describe(
      "Current service the client is booking (for contextual recommendations)",
    ),
  maxRecommendations: z
    .number()
    .optional()
    .default(5)
    .describe("Maximum number of recommendations to return"),
});

const GetUpsellRecommendationsInput = z.object({
  profileId: z
    .string()
    .describe("The profile ID to get upsell recommendations for"),
  phone: z
    .string()
    .describe("Client phone number with country code, e.g., +51987654321"),
  serviceId: z
    .string()
    .optional()
    .describe("Service the client is currently booking or has booked"),
  maxRecommendations: z
    .number()
    .optional()
    .default(5)
    .describe("Maximum number of upsell recommendations to return"),
});

/**
 * Tool: Get Client History
 *
 * Gets a client's appointment history including services used,
 * visit frequency, and time since last visit.
 */
export const getClientHistoryTool = createTool({
  name: "get_client_history",
  description:
    "Get a client's appointment history. Use this to understand what services a client has used before, their visit patterns, and preferences. Returns services used, dates, status, and statistics like total visits and time since last visit. This information is crucial for personalized service recommendations.",
  parameters: GetClientHistoryInput,
  execute: async ({ profileId, phone, limit = 10 }) => {
    try {
      const result = await getClientHistoryInternal(profileId, phone, limit);

      if (!result.found) {
        return {
          found: false,
          message: `No client found with phone ${phone}`,
          history: [],
          stats: {
            totalVisits: 0,
            lastVisitDaysAgo: null,
            favoriteServices: [],
          },
        };
      }

      return {
        found: true,
        client: result.client,
        history: result.history,
        stats: result.stats,
      };
    } catch (error) {
      return {
        error: true,
        message: sanitizeErrorMessage(error),
      };
    }
  },
});

/**
 * Tool: Get Service Recommendations
 *
 * Analyzes client history and recommends relevant services.
 * Considers: past services, categories, time since last visit.
 */
export const getServiceRecommendationsTool = createTool({
  name: "get_service_recommendations",
  description:
    "Get personalized service recommendations for a client based on their appointment history. Use this during booking conversations to suggest relevant services the client might be interested in. Considers their past services, preferred categories, and time since last visit. Returns recommended services with explanations.",
  parameters: GetServiceRecommendationsInput,
  execute: async ({
    profileId,
    phone,
    currentServiceId,
    maxRecommendations = 5,
  }) => {
    try {
      // Get client history first
      const historyResult = await getClientHistoryInternal(
        profileId,
        phone,
        20,
      );

      if (!historyResult.found) {
        // Client not found - return popular/new services
        const allServices =
          await medicalServiceRepository.findActiveByProfileId(profileId);
        return {
          hasHistory: false,
          recommendations: allServices
            .slice(0, maxRecommendations)
            .map((s: MedicalService) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              price: s.price ? `$${s.price}` : "Consultar",
              duration: s.duration ? `${s.duration} minutos` : null,
              category: s.category || undefined,
              reason: "Nuevo servicio disponible",
            })),
          message: "Cliente nuevo - mostrando servicios disponibles",
        };
      }

      const stats = historyResult.stats;
      const history = historyResult.history;
      const usedServiceIds = new Set(history.map((h) => h.serviceId));
      const usedCategories = new Set(stats.usedCategories || []);

      // Get all active services for the profile
      const allServices =
        await medicalServiceRepository.findActiveByProfileId(profileId);

      // Score each service for recommendation
      const scoredServices: Array<{
        service: MedicalService;
        score: number;
        reasons: string;
      }> = [];

      for (const service of allServices) {
        let score = 0;
        const reasons: string[] = [];

        // Not recommend services they've already booked (unless it's the current service)
        if (usedServiceIds.has(service.id) && service.id !== currentServiceId) {
          continue; // Skip already used services
        }

        // Score based on category match
        if (service.category && usedCategories.has(service.category)) {
          score += 30;
          reasons.push(`Categoría preferida: ${service.category}`);
        }

        // Score based on time since last visit
        if (stats.lastVisitDaysAgo !== null) {
          if (stats.lastVisitDaysAgo > 60) {
            // Client hasn't visited in a while - recommend maintenance services
            score += 20;
            reasons.push("Servicio de mantenimiento recomendado");
          }
        }

        // If client has history but no current service, score all unused services
        if (!currentServiceId && history.length > 0) {
          score += 10;
          reasons.push("Basado en tu historial");
        }

        // Boost services they've used before
        const serviceUsageCount = history.filter(
          (h) => h.serviceId === service.id,
        ).length;
        if (serviceUsageCount > 0) {
          score += serviceUsageCount * 5;
          reasons.push("Servicio que has usado anteriormente");
        }

        // If there's a current service, find related services via products
        if (currentServiceId) {
          // Get products used by current service
          const currentProducts =
            await serviceProductRepository.findByServiceIdAndProfile(
              currentServiceId,
              profileId,
              { isActive: true },
            );

          const currentProductIds = currentProducts.map((p) => p.productId);

          // Find services that use similar products
          if (currentProductIds.length > 0) {
            const relatedServices = await db
              .select()
              .from(serviceProductTable)
              .where(
                and(
                  eq(serviceProductTable.profileId, profileId),
                  inArray(serviceProductTable.productId, currentProductIds),
                  eq(serviceProductTable.isActive, true),
                ),
              );

            const relatedServiceIds = new Set(
              relatedServices.map((r) => r.serviceId),
            );
            if (relatedServiceIds.has(service.id)) {
              score += 40;
              reasons.push("Servicio complementario");
            }
          }
        }

        if (score > 0) {
          scoredServices.push({
            service,
            score,
            reasons: reasons.join(", "),
          });
        }
      }

      // Sort and limit recommendations
      const validRecommendations = scoredServices
        .sort((a, b) => b.score - a.score)
        .slice(0, maxRecommendations);

      const recommendations = validRecommendations.map((r) => ({
        id: r.service.id,
        name: r.service.name,
        description: r.service.description,
        price: r.service.price ? `$${r.service.price}` : "Consultar",
        duration: r.service.duration ? `${r.service.duration} minutos` : null,
        category: r.service.category || undefined,
        score: r.score,
        reason: r.reasons,
      }));

      // Generate contextual message
      let message = "";
      if (stats.lastVisitDaysAgo !== null && stats.lastVisitDaysAgo > 60) {
        message = `Han pasado ${stats.lastVisitDaysAgo} días desde tu última visita. ¡Te recomendamos nuestros servicios de mantenimiento!`;
      } else if (recommendations.length > 0) {
        message = `Basado en tu historial (${stats.totalVisits} visitas), te recomendamos:`;
      } else {
        message = "Tenemos los siguientes servicios disponibles:";
      }

      return {
        hasHistory: true,
        clientStats: {
          totalVisits: stats.totalVisits,
          lastVisitDaysAgo: stats.lastVisitDaysAgo,
          favoriteServices: stats.favoriteServices,
        },
        recommendations,
        message,
      };
    } catch (error) {
      return {
        error: true,
        message: sanitizeErrorMessage(error),
      };
    }
  },
});

/**
 * Tool: Get Upsell Recommendations
 *
 * Suggests complementary products or services that can be offered
 * during or after a service appointment.
 */
export const getUpsellRecommendationsTool = createTool({
  name: "get_upsell_recommendations",
  description:
    "Get upsell recommendations for a client. Use this during or after a booking to suggest complementary products or services that enhance the main service. For example, after booking a haircut, suggest a hair treatment. Returns product and service suggestions with pricing.",
  parameters: GetUpsellRecommendationsInput,
  execute: async ({ profileId, phone, serviceId, maxRecommendations = 5 }) => {
    try {
      // If no service specified, get the last booked service
      let targetServiceId = serviceId;

      if (!targetServiceId) {
        // Get last completed or upcoming reservation
        const reservations =
          await reservationRepository.findByPatientPhone(phone);
        const profileReservations = reservations
          .filter(
            (r) =>
              r.profileId === profileId &&
              (r.status === "completed" || r.status === "confirmed"),
          )
          .sort(
            (a, b) =>
              new Date(b.scheduledAtUtc).getTime() -
              new Date(a.scheduledAtUtc).getTime(),
          );

        if (profileReservations.length > 0) {
          targetServiceId = profileReservations[0].serviceId;
        }
      }

      const upsells: Array<{
        type: "product" | "service";
        id: string;
        name: string;
        description?: string;
        price: string;
        reason: string;
      }> = [];

      if (targetServiceId) {
        // Get products associated with this service
        const serviceProducts =
          await serviceProductRepository.findByServiceIdAndProfile(
            targetServiceId,
            profileId,
            { isActive: true },
          );

        // Get product details
        const productIds = serviceProducts.map((sp) => sp.productId);

        if (productIds.length > 0) {
          const products = await Promise.all(
            productIds.map(async (id) => {
              const product = await productRepository.findByIdAndProfile(
                id,
                profileId,
              );
              return product;
            }),
          );

          const activeProducts = products.filter(
            (p): p is NonNullable<typeof p> =>
              p !== undefined && p !== null && p.isActive,
          );

          for (const product of activeProducts) {
            upsells.push({
              type: "product",
              id: product.id,
              name: product.name,
              description: product.description || undefined,
              price: product.price ? `$${product.price}` : "Consultar",
              reason: "Producto utilizado en este servicio",
            });
          }
        }

        // Also find complementary services (services using same products)
        if (productIds.length > 0) {
          const relatedProducts = await db
            .select()
            .from(serviceProductTable)
            .where(
              and(
                eq(serviceProductTable.profileId, profileId),
                inArray(serviceProductTable.productId, productIds),
                eq(serviceProductTable.isActive, true),
              ),
            );

          const relatedServiceIds = [
            ...new Set(
              relatedProducts
                .filter((rp) => rp.serviceId !== targetServiceId)
                .map((rp) => rp.serviceId),
            ),
          ];

          if (relatedServiceIds.length > 0) {
            const relatedServices = await getServicesByIds(relatedServiceIds);

            for (const service of relatedServices) {
              upsells.push({
                type: "service",
                id: service.id,
                name: service.name,
                description: service.description || undefined,
                price: service.price ? `$${service.price}` : "Consultar",
                reason: "Servicio complementario",
              });
            }
          }
        }

        // Get the main service to provide context
        const mainService =
          await medicalServiceRepository.findById(targetServiceId);

        // Add category-based recommendations
        if (mainService?.category) {
          const categoryServices =
            await medicalServiceRepository.findByCategory(mainService.category);
          const categoryRecommendations = categoryServices
            .filter((s) => s.id !== targetServiceId && s.isActive)
            .slice(0, 2);

          for (const service of categoryRecommendations) {
            const alreadyAdded = upsells.some(
              (u) => u.id === service.id && u.type === "service",
            );
            if (!alreadyAdded) {
              upsells.push({
                type: "service",
                id: service.id,
                name: service.name,
                description: service.description || undefined,
                price: service.price ? `$${service.price}` : "Consultar",
                reason: `También en la categoría ${mainService.category}`,
              });
            }
          }
        }
      }

      // If no upsells found, return popular products
      if (upsells.length === 0) {
        const products =
          await productRepository.findByProfileIdDirect(profileId);
        const activeProducts = products
          .filter((p) => p.isActive)
          .slice(0, maxRecommendations);

        for (const product of activeProducts) {
          upsells.push({
            type: "product",
            id: product.id,
            name: product.name,
            description: product.description || undefined,
            price: product.price ? `$${product.price}` : "Consultar",
            reason: "Producto disponible",
          });
        }
      }

      // Limit results
      const finalUpsells = upsells.slice(0, maxRecommendations);

      // Separate products and services
      const products = finalUpsells.filter((u) => u.type === "product");
      const services = finalUpsells.filter((u) => u.type === "service");

      return {
        success: true,
        hasServiceContext: !!targetServiceId,
        upsells: finalUpsells,
        products,
        services,
        message: targetServiceId
          ? `Complementos recomendados para tu servicio:`
          : "Productos y servicios recomendados:",
      };
    } catch (error) {
      return {
        error: true,
        message: sanitizeErrorMessage(error),
      };
    }
  },
});
