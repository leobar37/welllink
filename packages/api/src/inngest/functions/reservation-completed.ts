import { inngest } from "../../lib/inngest-client";
import {
  type EventContext,
  type InngestFunctionContext,
} from "./types";
import type { MedicalReservationEvents } from "../../types/inngest-events";
import { db } from "../../db";
import { reservation, ReservationStatus } from "../../db/schema/reservation";
import { serviceProduct } from "../../db/schema/service-product";
import { inventoryItem } from "../../db/schema/inventory-item";
import { stockMovement } from "../../db/schema/stock-movement";
import { eq, and } from "drizzle-orm";

/**
 * Inngest function: handleReservationCompleted
 * 
 * Automatically deducts stock for products consumed when a reservation/appointment is completed.
 * This function:
 * 1. Listens for the reservation/completed event
 * 2. Looks up the service associated with the reservation
 * 3. Finds products linked to that service via service_product table
 * 4. Deducts stock for each product based on quantity_required
 * 5. Creates stock_movement records with reason 'service_consumption'
 * 6. Logs warnings for insufficient stock
 */
export const handleReservationCompleted = inngest.createFunction(
  {
    id: "handle-reservation-completed",
    name: "Handle Reservation Completed - Stock Deduction",
  },
  { event: "reservation/completed" },
  async ({
    event,
    step,
    logger,
  }: EventContext<"reservation/completed">) => {
    logger.info(
      `Processing stock deduction for completed reservation ${event.data.reservationId}`,
    );

    const { reservationId, profileId, completedAt } = event.data;

    // Step 1: Get reservation details to find the service
    const reservationData = await step.run("get-reservation", async () => {
      const [res] = await db
        .select()
        .from(reservation)
        .where(eq(reservation.id, reservationId));

      if (!res) {
        logger.warn(`Reservation ${reservationId} not found`);
        return null;
      }

      return {
        serviceId: res.serviceId,
        profileId: res.profileId,
        status: res.status,
      };
    });

    if (!reservationData) {
      return { success: false, reason: "reservation_not_found" };
    }

    // Step 2: Get products required for this service
    const serviceProducts = await step.run("get-service-products", async () => {
      const products = await db
        .select()
        .from(serviceProduct)
        .where(
          and(
            eq(serviceProduct.serviceId, reservationData.serviceId),
            eq(serviceProduct.profileId, profileId),
            eq(serviceProduct.isActive, true)
          )
        );

      return products.map((sp) => ({
        productId: sp.productId,
        quantityRequired: sp.quantityRequired,
        isRequired: sp.isRequired,
      }));
    });

    if (serviceProducts.length === 0) {
      logger.info(
        `No products linked to service ${reservationData.serviceId}, skipping stock deduction`,
      );
      return { success: true, productsDeducted: 0, warnings: [] };
    }

    // Step 3: Deduct stock for each product
    const deductionResults = await step.run("deduct-stock", async () => {
      const results: Array<{
        productId: string;
        quantityRequired: number;
        success: boolean;
        warning?: string;
      }> = [];

      for (const sp of serviceProducts) {
        // Get current inventory
        const [inventory] = await db
          .select()
          .from(inventoryItem)
          .where(
            and(
              eq(inventoryItem.productId, sp.productId),
              eq(inventoryItem.profileId, profileId)
            )
          );

        const currentStock = inventory?.quantity ?? 0;

        // Check if sufficient stock
        if (currentStock < sp.quantityRequired) {
          const warning = `Stock insuficiente para producto ${sp.productId}. Disponible: ${currentStock}, requerido: ${sp.quantityRequired}`;
          logger.warn(warning);

          results.push({
            productId: sp.productId,
            quantityRequired: sp.quantityRequired,
            success: false,
            warning,
          });

          // Skip deduction if insufficient stock but log the warning
          continue;
        }

        // Deduct stock
        const newQuantity = currentStock - sp.quantityRequired;

        // Update inventory
        await db
          .update(inventoryItem)
          .set({ quantity: newQuantity, updatedAt: new Date() })
          .where(
            and(
              eq(inventoryItem.productId, sp.productId),
              eq(inventoryItem.profileId, profileId)
            )
          );

        // Create stock movement record
        await db.insert(stockMovement).values({
          profileId,
          productId: sp.productId,
          inventoryItemId: inventory?.id,
          reason: "service_consumption" as any,
          quantity: -sp.quantityRequired,
          quantityBefore: currentStock,
          quantityAfter: newQuantity,
          location: inventory?.location ?? "default",
          referenceType: "reservation",
          referenceId: reservationId,
          notes: `Consumo por servicio completado - Reserva: ${reservationId}`,
          createdAt: new Date(completedAt ?? new Date()),
        });

        results.push({
          productId: sp.productId,
          quantityRequired: sp.quantityRequired,
          success: true,
        });

        logger.info(
          `Deducted ${sp.quantityRequired} units from product ${sp.productId}`,
        );
      }

      return results;
    });

    const successfulDeductions = deductionResults.filter((r) => r.success).length;
    const warnings = deductionResults
      .filter((r) => r.warning)
      .map((r) => r.warning!);

    logger.info(
      `Stock deduction completed: ${successfulDeductions}/${serviceProducts.length} products processed`,
    );

    return {
      success: true,
      reservationId,
      productsDeducted: successfulDeductions,
      totalProducts: serviceProducts.length,
      warnings,
    };
  },
);
