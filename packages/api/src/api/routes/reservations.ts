import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { errorMiddleware } from "../../middleware/error";
import { ReservationRequestService } from "../../services/business/reservation-request";
import { ApprovalService } from "../../services/business/approval";
import { NotificationService } from "../../services/business/notification";
import { ReservationRequestRepository } from "../../services/repository/reservation-request";
import { TimeSlotRepository } from "../../services/repository/time-slot";
import { MedicalServiceRepository } from "../../services/repository/medical-service";
import { ReservationRepository } from "../services/repository/reservation";
import { WhatsAppConfigRepository } from "../repository/whatsapp-config";
import { ProfileRepository } from "../repository/profile";
import { EvolutionService } from "./evolution-api";

export const reservationRoutes = new Elysia({ prefix: "/reservations" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .derive({ as: "global" }, ({ services }) => {
    // Use services from global plugin
    const evolutionService = services.evolutionService;

    const reservationRequestRepository = new ReservationRequestRepository();
    const timeSlotRepository = new TimeSlotRepository();
    const medicalServiceRepository = new MedicalServiceRepository();
    const reservationRepository = new ReservationRepository();
    const whatsappConfigRepository = new WhatsAppConfigRepository();
    const profileRepository = new ProfileRepository();

    const reservationRequestService = new ReservationRequestService(
      reservationRequestRepository,
      timeSlotRepository,
      medicalServiceRepository,
    );

    const approvalService = new ApprovalService(
      reservationRequestRepository,
      timeSlotRepository,
      reservationRepository,
    );

    const notificationService = new NotificationService(
      whatsappConfigRepository,
      profileRepository,
      evolutionService,
    );

    return {
      reservationRequestService,
      approvalService,
      notificationService,
    };
  })
  .post(
    "/request",
    async ({ body, set, reservationRequestService, notificationService }) => {
      const result = await reservationRequestService.createRequest(body);

      // Notify doctor about new request
      if (result.slot.profileId) {
        await notificationService.notifyDoctorNewRequest({
          requestId: result.request.id,
          profileId: result.slot.profileId,
          doctorPhone: result.slot.profileId, // TODO: Get actual doctor phone from profile
          patientName: result.request.patientName,
          patientPhone: result.request.patientPhone,
          serviceName: result.service.name,
          appointmentDate: result.slot.startTime,
          appointmentTime: result.slot.startTime,
          urgencyLevel: result.request.urgencyLevel || "normal",
          chiefComplaint: result.request.chiefComplaint || "",
        });
      }

      set.status = 201;
      return result;
    },
    {
      body: t.Object({
        slotId: t.String(),
        serviceId: t.String(),
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

      // Notify patient about approval
      if (result.reservation) {
        await notificationService.notifyPatientApproval({
          requestId: body.requestId,
          profileId: result.request.profileId,
          patientPhone: result.request.patientPhone,
          patientName: result.request.patientName,
          serviceName: result.request.serviceId, // TODO: Get actual service name
          appointmentDate: result.slot.startTime,
          appointmentTime: result.slot.startTime.toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          changes: body.changes,
        });
      }

      set.status = 200;
      return result;
    },
    {
      body: t.Object({
        requestId: t.String(),
        approvedBy: t.String(),
        notes: t.Optional(t.String()),
        changes: t.Optional(
          t.Object({
            serviceId: t.Optional(t.String()),
            timeSlotId: t.Optional(t.String()),
            price: t.Optional(t.Number()),
          }),
        ),
      }),
    },
  )
  .post(
    "/reject",
    async ({ body, set, approvalService, notificationService }) => {
      const result = await approvalService.rejectRequest(body);

      // Notify patient about rejection
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
