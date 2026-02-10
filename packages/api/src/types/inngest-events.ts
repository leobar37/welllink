export interface MedicalReservationEvents {
  "reservation/created": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      patientEmail?: string;
      serviceId: string;
      serviceName: string;
      // slotId: REMOVED - availability simplified
      appointmentTime: string;
      appointmentEndTime: string;
      timezone: string;
      doctorName: string;
      doctorPhone: string;
      clinicName: string;
      clinicAddress: string;
      price: number;
      urgencyLevel: "low" | "normal" | "high" | "urgent";
      source: "whatsapp" | "web" | "phone";
    };
  };

  "reservation/request-created": {
    data: {
      requestId: string;
      profileId: string;
      // slotId: REMOVED - availability simplified
      serviceId: string;
      patientName: string;
      patientPhone: string;
      patientEmail?: string;
      chiefComplaint?: string;
      symptoms?: string;
      medicalHistory?: string;
      currentMedications?: string;
      allergies?: string;
      urgencyLevel: "low" | "normal" | "high" | "urgent";
      preferredAtUtc: string;
      requestedTimezone: string;
      expiresAt: string;
    };
  };

  "reservation/approved": {
    data: {
      reservationId: string;
      profileId: string;
      requestId: string;
      approvedBy: string;
      approvedAt: string;
      patientName: string;
      patientPhone: string;
      appointmentTime: string;
      serviceName: string;
      doctorName: string;
      clinicName: string;
      clinicAddress: string;
      changes?: {
        originalTime?: string;
        newTime?: string;
        originalService?: string;
        newService?: string;
        durationChange?: number;
        notes?: string;
        priceAdjustment?: number;
      };
    };
  };

  "reservation/rejected": {
    data: {
      reservationId: string;
      profileId: string;
      requestId: string;
      rejectionReason: string;
      rejectedBy: string;
      rejectedAt: string;
    };
  };

  "reservation/cancelled": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      appointmentTime: string;
      serviceName: string;
      cancellationReason?: string;
      cancelledBy: "patient" | "doctor" | "system";
      cancelledAt: string;
      refundAmount?: number;
    };
  };

  "reservation/completed": {
    data: {
      reservationId: string;
      profileId: string;
      completedAt: string;
      notes?: string;
      followUpRequired?: boolean;
      nextAppointmentDate?: string;
      prescriptionIssued?: boolean;
    };
  };

  "appointment/reminder-24h": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      appointmentTime: string;
      serviceName: string;
      doctorName: string;
      clinicName: string;
      clinicAddress: string;
      requestedTimezone: string;
      preparationInstructions?: string;
    };
  };

  "appointment/reminder-2h": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      appointmentTime: string;
      serviceName: string;
      clinicName: string;
      clinicAddress: string;
      requestedTimezone: string;
      parkingInfo?: string;
      buildingInfo?: string;
      floorInfo?: string;
      officeNumber?: string;
    };
  };

  "appointment/follow-up": {
    data: {
      reservationId: string;
      profileId: string;
      patientName: string;
      patientPhone: string;
      appointmentDate: string;
      followUpType: "24h" | "48h" | "1week" | "2weeks";
      followUpQuestions: string[];
    };
  };

  // slot/generate-daily: REMOVED - availability simplified, no pre-generated slots

  // slot/expired-cleanup: REMOVED - availability simplified, no pre-generated slots

  "availability/changed": {
    data: {
      profileId: string;
      changedBy: string;
      changes: {
        workDays?: number[];
        workStartTime?: string;
        workEndTime?: string;
        appointmentDuration?: number;
        isAcceptingAppointments?: boolean;
      };
      effectiveDate: string;
    };
  };

  "medical-service/created": {
    data: {
      serviceId: string;
      profileId: string;
      name: string;
      duration: number;
      price: number;
      category: string;
      createdBy: string;
    };
  };

  "medical-service/updated": {
    data: {
      serviceId: string;
      profileId: string;
      changes: Partial<{
        name: string;
        description: string;
        duration: number;
        price: number;
        requirements: string;
      }>;
      updatedBy: string;
    };
  };

  "doctor/new-request": {
    data: {
      profileId: string;
      doctorName: string;
      doctorPhone: string;
      requestId: string;
      patientName: string;
      patientPhone: string;
      serviceName: string;
      appointmentTime: string;
      urgencyLevel: string;
      chiefComplaint?: string;
    };
  };

  "doctor/request-expired": {
    data: {
      profileId: string;
      doctorName: string;
      requestId: string;
      patientName: string;
      expiredAt: string;
    };
  };
}
