import { createTool } from "@voltagent/core";
import { z } from "zod";
import { MedicalServiceRepository } from "../../../../services/repository/medical-service";

const medicalServiceRepository = new MedicalServiceRepository();

const ListServicesInput = z.object({
  profileId: z.string().describe("The profile ID to list services for"),
  category: z.string().optional().describe("Filter services by category"),
});

const GetServiceDetailsInput = z.object({
  profileId: z.string().describe("The profile ID the service belongs to"),
  serviceId: z.string().describe("The service ID to look up"),
});

export const listServicesTool = createTool({
  name: "list_services",
  description:
    "List all available medical services. Use this to show patients what services are offered. Returns service name, description, price, and duration. Optionally filter by category.",
  parameters: ListServicesInput,
  execute: async ({ profileId, category }) => {
    try {
      let services;
      if (category) {
        services = await medicalServiceRepository.findByCategory(category);
        services = services.filter((s) => s.profileId === profileId);
      } else {
        services =
          await medicalServiceRepository.findActiveByProfileId(profileId);
      }

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

export const getServiceDetailsTool = createTool({
  name: "get_service_details",
  description:
    "Get detailed information about a specific service. Use this when a patient asks about a particular service. Returns full details including requirements and preparation instructions.",
  parameters: GetServiceDetailsInput,
  execute: async ({ profileId, serviceId }) => {
    try {
      const service = await medicalServiceRepository.findById(serviceId);

      if (!service || service.profileId !== profileId) {
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
