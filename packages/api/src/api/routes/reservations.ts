import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { errorMiddleware } from "../../middleware/error";
import { ReservationRequestService } from "../../services/business/reservation-request";
import { ApprovalService } from "../../services/business/approval";
import { NotificationService } from "../../services/business/notification";
import { ReservationRequestRepository } from "../../services/repository/reservation-request";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { ReservationRepository } from "../../services/repository/reservation";
import { WhatsAppConfigRepository } from "../../services/repository/whatsapp-config";
import { ProfileRepository } from "../../services/repository/profile";
import { AvailabilityValidationService } from "../../services/business/availability-validation";

export const reservationRoutes = new Elysia({ prefix: "/reservations" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .derive({ as: "global" }, ({ services }) => {
    const { evolutionService, availabilityValidationService } = services;

    const reservationRequestRepository = new ReservationRequestRepository();
    const medicalServiceRepository = new MedicalServiceRepository();
    const reservationRepository = new ReservationRepository();
    const whatsappConfigRepository = new WhatsAppConfigRepository();
    const profileRepository = new ProfileRepository();

    const reservationRequestService = new ReservationRequestService(
      reservationRequestRepository,
      medicalServiceRepository,
      availabilityValidationService,
    );

    const approvalService = new ApprovalService(
      reservationRequestRepository,
      reservationRepository,
      profileRepository,
    );

    const notificationService = new NotificationService(
      whatsappConfigRepository,
      profileRepository,
      medicalServiceRepository,
      evolutionService,
    );

    return {
      reservationRequestService,
      approvalService,
      notificationService,
      availabilityValidationService,
    };
  })
  .post(
    "/request",
    async ({ body, set, reservationRequestService, notificationService }) => {
      const result = await reservationRequestService.createRequest(body);

      if (result.request) {
        await notificationService.notifyDoctorNewRequest({
          requestId: result.request.id,
          profileId: result.request.profileId,
          serviceId: result.request.serviceId,
          patientName: result.request.patientName,
          patientPhone: result.request.patientPhone,
          preferredAtUtc: result.request.preferredAtUtc,
          requestedTimezone: result.request.requestedTimezone,
          urgencyLevel: result.request.urgencyLevel || "normal",
          chiefComplaint: result.request.chiefComplaint || "",
        });
      }

      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        profileId: t.String(),
        serviceId: t.String(),
        preferredDate: t.String(),
        preferredTime: t.String(),
        timezone: t.String(),
        patientName: t.String({ minLength: 1 }),
        patientPhone: t.String({ minLength: 10 }),
        patientEmail: t.Optional(t.String()),
        patientAge: t.Optional(t.Integer()),
        patientGender: t.Optional(t.String()),
        chiefComplaint: t.Optional(t.String()),
        symptoms: t.Optional(t.String()),
        medicalHistory: t.Optional(t.String()),
        currentMedications: t.Optional(t.String()),
        allergies: t.Optional(t.String()),
        urgencyLevel: t.Optional(
          t.Union([
            t.Literal("low"),
            t.Literal("normal"),
            t.Literal("high"),
            t.Literal("urgent"),
          ]),
        ),
        metadata: t.Optional(
          t.Object({
            symptoms: t.Optional(t.Array(t.String())),
            urgencyLevel: t.Optional(
              t.Union([
                t.Literal("low"),
                t.Literal("normal"),
                t.Literal("high"),
                t.Literal("urgent"),
              ]),
            ),
            isNewPatient: t.Optional(t.Boolean()),
            insuranceProvider: t.Optional(t.String()),
            notes: t.Optional(t.String()),
          }),
        ),
      }),
    },
  )
  .get("/pending/:profileId", async ({ params, reservationRequestService }) => {
    return reservationRequestService.getPendingRequests(params.profileId);
  })
  .get("/request/:requestId", async ({ params, reservationRequestService }) => {
    return reservationRequestService.getRequestById(params.requestId);
  })
  .get("/patient/:phone", async ({ params, reservationRequestService }) => {
    return reservationRequestService.getPatientHistory(params.phone);
  })
  .get("/stats/:profileId", async ({ params, reservationRequestService }) => {
    return reservationRequestService.getStats(params.profileId);
  })
  .post(
    "/approve",
    async ({ body, set, approvalService, notificationService }) => {
      const result = await approvalService.approveRequest(body);

      if (result.reservation && result.request) {
        await notificationService.notifyPatientApproval({
          requestId: body.requestId,
          profileId: result.request.profileId,
          serviceId: result.request.serviceId,
          patientPhone: result.request.patientPhone,
          patientName: result.request.patientName,
          scheduledAtUtc: result.reservation.scheduledAtUtc,
          scheduledTimezone: result.reservation.scheduledTimezone,
          notes: body.notes,
        });
      }

      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        requestId: t.String(),
        approvedBy: t.String(),
        scheduledDate: t.String(),
        scheduledTime: t.String(),
        timezone: t.String(),
        notes: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/reject",
    async ({ body, set, approvalService, notificationService }) => {
      const result = await approvalService.rejectRequest(body);

      if (result.request) {
        await notificationService.notifyPatientRejection({
          requestId: body.requestId,
          profileId: result.request.profileId,
          patientPhone: result.request.patientPhone,
          patientName: result.request.patientName,
          rejectionReason: body.rejectionReason,
        });
      }

      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        requestId: t.String(),
        rejectedBy: t.String(),
        rejectionReason: t.String({ minLength: 1 }),
      }),
    },
  );
