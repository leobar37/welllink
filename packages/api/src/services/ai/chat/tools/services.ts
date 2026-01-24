import { createTool } from "@voltagent/core";
import { z } from "zod";
import { db } from "../../../../db";
import { medicalService } from "../../../../db/schema/medical-service";
import { eq, and, desc } from "drizzle-orm";

/**
 * Input schema for listing services
 */
const ListServicesInput = z.object({
  profileId: z.string().describe("The profile ID to list services for"),
  category: z.string().optional().describe("Filter services by category"),
});

/**
 * Input schema for getting service details
 */
const GetServiceDetailsInput = z.object({
  profileId: z.string().describe("The profile ID the service belongs to"),
  serviceId: z.string().describe("The service ID to look up"),
});

/**
 * Tool to list available medical services
 */
export const listServicesTool = createTool({
  name: "list_services",
  description:
    "List all available medical services. Use this to show patients what services are offered. Returns service name, description, price, and duration. Optionally filter by category.",
  parameters: ListServicesInput,
  execute: async ({ profileId, category }) => {
    try {
      let query = db
        .select({
          id: medicalService.id,
          name: medicalService.name,
          description: medicalService.description,
          price: medicalService.price,
          duration: medicalService.duration,
          category: medicalService.category,
        })
        .from(medicalService)
        .where(
          and(
            eq(medicalService.profileId, profileId),
            eq(medicalService.isActive, true)
          )
        );

      if (category) {
        query = query.where(
          and(
            eq(medicalService.profileId, profileId),
            eq(medicalService.isActive, true),
            eq(medicalService.category, category)
          )
        ) as typeof query;
      }

      const services = await query.orderBy(desc(medicalService.createdAt));

      return {
        success: true,
        services: services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          price: s.price ? `$${s.price}` : "Consultar",
          duration: s.duration ? `${s.duration} minutos` : null,
          category: s.category,
        })),
      };
    } catch (error) {
      return {
        error: true,
        message: `Error listing services: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

/**
 * Tool to get detailed information about a specific service
 */
export const getServiceDetailsTool = createTool({
  name: "get_service_details",
  description:
    "Get detailed information about a specific service. Use this when a patient asks about a particular service. Returns full details including requirements and preparation instructions.",
  parameters: GetServiceDetailsInput,
  execute: async ({ profileId, serviceId }) => {
    try {
      const [service] = await db
        .select({
          id: medicalService.id,
          name: medicalService.name,
          description: medicalService.description,
          price: medicalService.price,
          duration: medicalService.duration,
          category: medicalService.category,
          requirements: medicalService.requirements,
        })
        .from(medicalService)
        .where(
          and(
            eq(medicalService.id, serviceId),
            eq(medicalService.profileId, profileId)
          )
        )
        .limit(1);

      if (!service) {
        return {
          error: true,
          message: `Service with ID ${serviceId} not found`,
        };
      }

      return {
        success: true,
        service: {
          id: service.id,
          name: service.name,
          description: service.description,
          price: service.price ? `$${service.price}` : "Consultar precio",
          duration: service.duration ? `${service.duration} minutos` : null,
          category: service.category,
          requirements: service.requirements,
        },
      };
    } catch (error) {
      return {
        error: true,
        message: `Error getting service details: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
