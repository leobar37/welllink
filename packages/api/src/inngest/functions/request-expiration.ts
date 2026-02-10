import { inngest } from "../../lib/inngest-client";
import { ReservationRequestRepository } from "../../services/repository/reservation-request";
import { ReservationRepository } from "../../services/repository/reservation";
import { ApprovalService } from "../../services/business/approval";
import { NotificationService } from "../../services/business/notification";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { WhatsAppConfigRepository } from "../../services/repository/whatsapp-config";
import { ProfileRepository } from "../../services/repository/profile";
import { evolutionService, type InngestFunctionContext } from "./types";
import type { ReservationRequest } from "../../db/schema/reservation-request";

export const expirePendingRequests = inngest.createFunction(
  {
    id: "expire-pending-requests",
    name: "Expire Pending Reservation Requests",
  },
  { cron: "*/5 * * * *" },
  async ({ step, logger }: InngestFunctionContext) => {
    logger.info("Starting expiration check for pending requests");

    const reservationRequestRepository = new ReservationRequestRepository();
    const reservationRepository = new ReservationRepository();
    const approvalService = new ApprovalService(
      reservationRequestRepository,
      reservationRepository,
    );
    const whatsappConfigRepository = new WhatsAppConfigRepository();
    const profileRepository = new ProfileRepository();
    const medicalServiceRepository = new MedicalServiceRepository();
    const notificationService = new NotificationService(
      whatsappConfigRepository,
      profileRepository,
      medicalServiceRepository,
      evolutionService,
    );

    const expiredRequests = await step.run(
      "find-expired-requests",
      async () => {
        return await reservationRequestRepository.findExpiredRequests();
      },
    );

    const results = await Promise.all(
      expiredRequests.map(async (request: ReservationRequest) => {
        const result = await approvalService.expireRequest(request.id);

        if (result.success) {
          const service = await medicalServiceRepository.findById(
            request.serviceId,
          );
          const profile = await profileRepository.findById(request.profileId);

          if (profile && service) {
            await notificationService.notifyPatientExpiration(
              request.profileId,
              request.patientPhone,
              request.patientName,
              service.name,
            );

            if (profile.whatsappNumber) {
              await notificationService.notifyDoctorExpiration(
                request.profileId,
                profile.whatsappNumber,
                request.patientName,
                request.preferredAtUtc,
                request.requestedTimezone,
              );
            }
          }

          await inngest.send({
            name: "doctor/request-expired",
            data: {
              profileId: request.profileId,
              requestId: request.id,
              patientName: request.patientName,
              expiredAt: new Date().toISOString(),
            },
          });
        }

        return { requestId: request.id, ...result };
      }),
    );

    return {
      success: true,
      processedCount: results.length,
      results,
    };
  },
);
