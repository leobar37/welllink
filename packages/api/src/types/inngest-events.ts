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
      slotId: string;
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
      slotId: string;
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
      requestedTime: string;
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

  "slot/generate-daily": {
    data: {
      profileId: string;
      targetDate: string;
      timezone: string;
      generateForServices: string[];
    };
  };

  "slot/expired-cleanup": {
    data: {
      profileId: string;
      expiredSlotIds: string[];
      cleanupDate: string;
    };
  };

  "availability/changed": {
    data: {
      profileId: string;
      changedBy: string;
      changes: {
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
        slotDuration?: number;
        bufferTime?: number;
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
