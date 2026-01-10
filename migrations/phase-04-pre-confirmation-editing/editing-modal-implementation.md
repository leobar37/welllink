# Phase 4: Pre-confirmation Editing

## 🎯 Overview

Implementation of pre-confirmation editing capabilities for doctors to modify appointment details before final approval.

## 📋 Implementation Files

- `editing-modal-implementation.tsx` - Doctor editing interface
- `approval-with-changes.ts` - Logic for approving with modifications
- `change-validation.ts` - Validation rules for doctor changes
- `doctor-editing-service.ts` - Business logic for editing
- `edit-request-api.ts` - API endpoints for editing

## 🏗️ Core Implementation

### 1. Doctor Editing Modal Component

```typescript
// packages/web/src/components/doctor/edit-request-modal.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface EditRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ReservationRequest;
  availableSlots: TimeSlot[];
  services: MedicalService[];
  onSave: (changes: DoctorChanges) => void;
}

export const EditRequestModal = ({
  isOpen,
  onClose,
  request,
  availableSlots,
  services,
  onSave
}: EditRequestModalProps) => {
  const [changes, setChanges] = useState<DoctorChanges>({});
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    request.requestedTime ? new Date(request.requestedTime) : undefined
  );
  const [filteredSlots, setFilteredSlots] = useState<TimeSlot[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (selectedDate) {
      const slotsForDate = availableSlots.filter(slot =>
        isSameDay(slot.startTime, selectedDate)
      );
      setFilteredSlots(slotsForDate);
    }
  }, [selectedDate, availableSlots]);

  const validateChanges = (): boolean => {
    const errors: string[] = [];

    if (changes.slotId && !changes.slotId) {
      errors.push("Debe seleccionar un horario");
    }

    if (changes.duration && (changes.duration < 15 || changes.duration > 180)) {
      errors.push("La duración debe estar entre 15 y 180 minutos");
    }

    if (changes.priceAdjustment && (changes.priceAdjustment < -100 || changes.priceAdjustment > 100)) {
      errors.push("El ajuste de precio debe estar entre -100% y +100%");
    }

    if (changes.notes && changes.notes.length < 10) {
      errors.push("Las notas deben tener al menos 10 caracteres");
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSave = () => {
    if (validateChanges()) {
      onSave(changes);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Solicitud de Cita</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Patient Information (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Información del Paciente</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Nombre:</Label>
                <p className="font-medium">{request.patientName}</p>
              </div>
              <div>
                <Label>Teléfono:</Label>
                <p className="font-medium">{request.patientPhone}</p>
              </div>
              <div>
                <Label>Edad:</Label>
                <p className="font-medium">{request.patientAge || 'No especificada'}</p>
              </div>
              <div>
                <Label>Género:</Label>
                <p className="font-medium">{request.patientGender || 'No especificado'}</p>
              </div>
            </div>

            <div className="mt-3">
              <Label>Motivo de consulta:</Label>
              <p className="text-sm bg-white p-2 rounded border">{request.chiefComplaint}</p>
            </div>

            {request.symptoms && (
              <div className="mt-3">
                <Label>Síntomas:</Label>
                <p className="text-sm bg-white p-2 rounded border">{request.symptoms}</p>
              </div>
            )}
          </div>

          {/* Editing Options */}
          <div className="space-y-4">
            <h3 className="font-semibold">Opciones de Edición</h3>

            {/* Change Time Slot */}
            <div className="space-y-2">
              <Label>Cambiar Horario</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border"
                disabled={(date) => date < new Date()}
              />

              {selectedDate && (
                <div className="space-y-2">
                  <Label>Horarios Disponibles</Label>
                  <Select
                    value={changes.slotId}
                    onValueChange={(value) => setChanges({...changes, slotId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione un horario" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSlots.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {format(slot.startTime, 'HH:mm')} - {format(slot.endTime, 'HH:mm')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Change Service */}
            <div className="space-y-2">
              <Label>Cambiar Servicio</Label>
              <Select
                value={changes.serviceId}
                onValueChange={(value) => setChanges({...changes, serviceId: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Servicio actual: {request.serviceName}" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name} - ${service.price} ({service.duration} min)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Change Duration */}
            <div className="space-y-2">
              <Label>Cambiar Duración (minutos)</Label>
              <Select
                value={changes.duration?.toString()}
                onValueChange={(value) => setChanges({...changes, duration: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Duración actual" />
                </SelectTrigger>
                <SelectContent>
                  {[15, 30, 45, 60, 90, 120, 150, 180].map((duration) => (
                    <SelectItem key={duration} value={duration.toString()}>
                      {duration} minutos
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Adjust Price */}
            <div className="space-y-2">
              <Label>Ajustar Precio (%)</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={changes.priceAdjustment || ''}
                  onChange={(e) => setChanges({...changes, priceAdjustment: parseInt(e.target.value) || undefined})}
                  className="w-20"
                  min="-100"
                  max="100"
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>

            {/* Add Notes */}
            <div className="space-y-2">
              <Label>Notas para el Paciente</Label>
              <Textarea
                placeholder="Agregue instrucciones o notas importantes para el paciente..."
                value={changes.notes || ''}
                onChange={(e) => setChanges({...changes, notes: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <ul className="text-sm text-red-600 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={validationErrors.length > 0}
            >
              Guardar Cambios y Aprobar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### 2. Doctor Editing Service Implementation

```typescript
// packages/api/src/services/business/doctor-editing-service.ts
import { ReservationRequestRepository } from "../repository/reservation-request-repository";
import { TimeSlotRepository } from "../repository/time-slot-repository";
import { MedicalServiceRepository } from "../repository/medical-service-repository";
import { InngestEventService } from "../ingest/inngest-event-service";

export interface DoctorChanges {
  slotId?: string; // Change time slot
  serviceId?: string; // Change medical service
  duration?: number; // Change appointment duration (minutes)
  priceAdjustment?: number; // Price adjustment percentage (-100 to +100)
  notes?: string; // Additional notes for patient
}

export class DoctorEditingService {
  constructor(
    private reservationRequestRepository: ReservationRequestRepository,
    private timeSlotRepository: TimeSlotRepository,
    private medicalServiceRepository: MedicalServiceRepository,
    private inngestEventService: InngestEventService,
  ) {}

  /**
   * Get editable data for a request
   */
  async getEditableRequestData(
    requestId: string,
    doctorId: string,
  ): Promise<{
    request: ReservationRequest;
    availableSlots: TimeSlot[];
    services: MedicalService[];
    currentService?: MedicalService;
    canEdit: boolean;
  }> {
    const request = await this.reservationRequestRepository.findById(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    // Verify doctor authorization
    if (request.profileId !== doctorId) {
      throw new Error("Unauthorized to edit this request");
    }

    // Only pending requests can be edited
    if (request.status !== "pending") {
      throw new Error("Cannot edit request that is not pending");
    }

    // Get available slots for the same date
    const requestDate = new Date(request.requestedTime);
    const availableSlots =
      await this.timeSlotRepository.findAvailableSlotsForDate(
        doctorId,
        requestDate,
      );

    // Get all services for this doctor
    const services =
      await this.medicalServiceRepository.findActiveByProfileId(doctorId);

    // Get current service details
    const currentService = await this.medicalServiceRepository.findById(
      request.serviceId,
    );

    return {
      request,
      availableSlots,
      services,
      currentService,
      canEdit: true,
    };
  }

  /**
   * Validate doctor changes before applying
   */
  async validateChanges(
    request: ReservationRequest,
    changes: DoctorChanges,
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate time slot change
    if (changes.slotId && changes.slotId !== request.slotId) {
      const newSlot = await this.timeSlotRepository.findById(changes.slotId);

      if (!newSlot) {
        errors.push("El nuevo horario no existe");
      } else if (newSlot.status !== "available") {
        errors.push("El nuevo horario no está disponible");
      } else if (newSlot.profileId !== request.profileId) {
        errors.push("El nuevo horario no pertenece a este doctor");
      } else if (newSlot.startTime < new Date()) {
        errors.push("El nuevo horario ya pasó");
      }
    }

    // Validate service change
    if (changes.serviceId && changes.serviceId !== request.serviceId) {
      const newService = await this.medicalServiceRepository.findById(
        changes.serviceId,
      );

      if (!newService) {
        errors.push("El nuevo servicio no existe");
      } else if (newService.profileId !== request.profileId) {
        errors.push("El nuevo servicio no pertenece a este doctor");
      } else if (!newService.isActive) {
        errors.push("El nuevo servicio no está activo");
      }
    }

    // Validate duration
    if (changes.duration !== undefined) {
      if (changes.duration < 15 || changes.duration > 180) {
        errors.push("La duración debe estar entre 15 y 180 minutos");
      }

      if (changes.slotId) {
        const slot = await this.timeSlotRepository.findById(changes.slotId);
        if (slot) {
          const slotDuration =
            (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
          if (changes.duration > slotDuration) {
            errors.push(
              "La duración no puede ser mayor que el tiempo disponible del slot",
            );
          }
        }
      }
    }

    // Validate price adjustment
    if (changes.priceAdjustment !== undefined) {
      if (changes.priceAdjustment < -100 || changes.priceAdjustment > 100) {
        errors.push("El ajuste de precio debe estar entre -100% y +100%");
      }
    }

    // Validate notes
    if (changes.notes && changes.notes.length > 0) {
      if (changes.notes.length < 10) {
        errors.push("Las notas deben tener al menos 10 caracteres");
      }
      if (changes.notes.length > 500) {
        errors.push("Las notas no pueden exceder 500 caracteres");
      }
    }

    // Warnings for significant changes
    if (changes.duration && changes.duration > 60) {
      warnings.push("Duración prolongada - verifique disponibilidad");
    }

    if (changes.priceAdjustment && Math.abs(changes.priceAdjustment) > 50) {
      warnings.push("Ajuste de precio significativo - confirme con paciente");
    }

    if (changes.serviceId) {
      warnings.push("Cambio de servicio - asegúrese de que sea apropiado");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Apply changes to request and approve
   */
  async applyChangesAndApprove(
    requestId: string,
    doctorId: string,
    changes: DoctorChanges,
  ): Promise<{
    success: boolean;
    request: ReservationRequest;
    reservation: Reservation;
    changesApplied: DoctorChanges;
  }> {
    const request = await this.reservationRequestRepository.findById(requestId);

    if (!request || request.status !== "pending") {
      throw new Error("Request not found or not pending");
    }

    if (request.profileId !== doctorId) {
      throw new Error("Unauthorized to approve this request");
    }

    // Validate changes
    const validation = await this.validateChanges(request, changes);
    if (!validation.isValid) {
      throw new Error("Invalid changes: " + validation.errors.join(", "));
    }

    // Apply changes
    const appliedChanges = await this.applyChanges(request, changes, doctorId);

    // Update request status to approved
    const approvedRequest =
      await this.reservationRequestRepository.updateStatus(
        requestId,
        "approved",
        doctorId,
      );

    // Create confirmed reservation
    const reservation = await this.createReservationFromRequest(
      approvedRequest,
      appliedChanges,
    );

    // Log changes for audit
    await this.logDoctorChanges(requestId, doctorId, appliedChanges);

    return {
      success: true,
      request: approvedRequest,
      reservation,
      changesApplied: appliedChanges,
    };
  }

  /**
   * Apply individual changes to request
   */
  private async applyChanges(
    request: ReservationRequest,
    changes: DoctorChanges,
    doctorId: string,
  ): Promise<DoctorChanges> {
    const appliedChanges: DoctorChanges = {};

    // Change time slot
    if (changes.slotId && changes.slotId !== request.slotId) {
      await this.reservationRequestRepository.updateSlot(
        request.id,
        changes.slotId,
      );
      appliedChanges.slotId = changes.slotId;
    }

    // Change service
    if (changes.serviceId && changes.serviceId !== request.serviceId) {
      await this.reservationRequestRepository.updateService(
        request.id,
        changes.serviceId,
      );
      appliedChanges.serviceId = changes.serviceId;
    }

    // Change duration
    if (changes.duration && changes.duration !== request.duration) {
      await this.reservationRequestRepository.updateDuration(
        request.id,
        changes.duration,
      );
      appliedChanges.duration = changes.duration;
    }

    // Add price adjustment
    if (changes.priceAdjustment !== undefined) {
      await this.reservationRequestRepository.updatePriceAdjustment(
        request.id,
        changes.priceAdjustment,
      );
      appliedChanges.priceAdjustment = changes.priceAdjustment;
    }

    // Add doctor notes
    if (changes.notes && changes.notes.length > 0) {
      await this.reservationRequestRepository.addDoctorNotes(
        request.id,
        changes.notes,
        doctorId,
      );
      appliedChanges.notes = changes.notes;
    }

    return appliedChanges;
  }

  /**
   * Create reservation from approved request with changes
   */
  private async createReservationFromRequest(
    request: ReservationRequest,
    changes: DoctorChanges,
  ): Promise<Reservation> {
    const service = await this.medicalServiceRepository.findById(
      changes.serviceId || request.serviceId,
    );

    const originalPrice = service?.price || 0;
    const adjustedPrice = changes.priceAdjustment
      ? originalPrice * (1 + changes.priceAdjustment / 100)
      : originalPrice;

    return await this.reservationRepository.create({
      profileId: request.profileId,
      slotId: changes.slotId || request.slotId,
      serviceId: changes.serviceId || request.serviceId,
      requestId: request.id,
      patientName: request.patientName,
      patientPhone: request.patientPhone,
      patientEmail: request.patientEmail,
      status: "confirmed",
      source: "whatsapp",
      duration: changes.duration || request.duration || 30,
      priceAtBooking: adjustedPrice,
      notes: changes.notes || request.doctorNotes,
      createdAt: new Date(),
    });
  }

  /**
   * Log doctor changes for audit trail
   */
  private async logDoctorChanges(
    requestId: string,
    doctorId: string,
    changes: DoctorChanges,
  ): Promise<void> {
    await this.auditService.logDoctorChanges({
      requestId,
      doctorId,
      changes,
      timestamp: new Date(),
    });
  }

  /**
   * Get editing statistics for analytics
   */
  async getEditingStatistics(
    doctorId: string,
    timeRange: DateRange,
  ): Promise<{
    totalEdits: number;
    mostCommonChanges: {
      timeChanges: number;
      serviceChanges: number;
      durationChanges: number;
      priceAdjustments: number;
    };
    averageChangesPerRequest: number;
    approvalRateWithChanges: number;
  }> {
    const requests =
      await this.reservationRequestRepository.findByDoctorAndDateRange(
        doctorId,
        timeRange.start,
        timeRange.end,
      );

    const editedRequests = requests.filter((req) => req.hasChanges);

    return {
      totalEdits: editedRequests.length,
      mostCommonChanges: {
        timeChanges: editedRequests.filter((req) => req.changes?.slotId).length,
        serviceChanges: editedRequests.filter((req) => req.changes?.serviceId)
          .length,
        durationChanges: editedRequests.filter((req) => req.changes?.duration)
          .length,
        priceAdjustments: editedRequests.filter(
          (req) => req.changes?.priceAdjustment,
        ).length,
      },
      averageChangesPerRequest:
        editedRequests.reduce(
          (sum, req) => sum + Object.keys(req.changes || {}).length,
          0,
        ) / editedRequests.length,
      approvalRateWithChanges:
        editedRequests.filter((req) => req.status === "approved").length /
        editedRequests.length,
    };
  }
}
```

## 3. Change Validation Rules

```typescript
// packages/api/src/validation/doctor-changes-validation.ts
export const DOCTOR_CHANGE_VALIDATION_RULES = {
  SLOT_CHANGE: {
    MIN_NOTICE_HOURS: 2, // Must change at least 2 hours in advance
    MAX_DAYS_AHEAD: 30, // Can only change up to 30 days ahead
    BLOCKED_TIME_RANGES: ["12:00-13:00"], // Lunch break
    MIN_DURATION_MINUTES: 15,
    MAX_DURATION_MINUTES: 180,
  },

  SERVICE_CHANGE: {
    ALLOWED_CATEGORIES: ["consulta", "procedimiento", "analisis"],
    REQUIRES_APPROVAL: true,
    MAX_PRICE_DIFFERENCE: 200, // Percentage
  },

  DURATION_CHANGE: {
    MIN: 15,
    MAX: 180,
    MUST_FIT_SLOT: true, // Duration can't exceed slot time
    BUFFER_MINUTES: 5, // Minimum time between appointments
  },

  PRICE_ADJUSTMENT: {
    MIN: -50, // -50% discount max
    MAX: 100, // +100% increase max
    REQUIRES_JUSTIFICATION: true,
    AUTO_APPROVE_RANGE: [-20, 20], // -20% to +20% auto-approved
  },

  NOTES: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
    REQUIRED_FOR_MAJOR_CHANGES: true,
    PROHIBITED_WORDS: ["descuento", "gratis", "promoción"], // Avoid promotional language
  },
};

export const validateDoctorChanges = async (
  changes: DoctorChanges,
  request: ReservationRequest,
  doctor: Profile,
): Promise<ValidationResult> => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];

  // Validate slot changes
  if (changes.slotId) {
    const newSlot = await timeSlotRepository.findById(changes.slotId);

    // Check if change is within allowed time
    const hoursUntilAppointment =
      (newSlot.startTime.getTime() - Date.now()) / (1000 * 60 * 60);
    if (
      hoursUntilAppointment <
      DOCTOR_CHANGE_VALIDATION_RULES.SLOT_CHANGE.MIN_NOTICE_HOURS
    ) {
      errors.push(
        `Debe cambiar con al menos ${DOCTOR_CHANGE_VALIDATION_RULES.SLOT_CHANGE.MIN_NOTICE_HOURS} horas de anticipación`,
      );
    }

    // Check if slot is in blocked time range
    const slotTime = format(newSlot.startTime, "HH:mm");
    const isBlockedTime =
      DOCTOR_CHANGE_VALIDATION_RULES.SLOT_CHANGE.BLOCKED_TIME_RANGES.some(
        (range) => {
          const [start, end] = range.split("-");
          return slotTime >= start && slotTime <= end;
        },
      );

    if (isBlockedTime) {
      warnings.push(
        "Este horario está en el rango de tiempo bloqueado (almuerzo)",
      );
    }

    // Check if duration fits slot
    if (changes.duration) {
      const slotDuration =
        (newSlot.endTime.getTime() - newSlot.startTime.getTime()) / (1000 * 60);
      if (changes.duration > slotDuration) {
        errors.push(
          "La duración no puede exceder el tiempo disponible del horario",
        );
      }
    }
  }

  // Validate service changes
  if (changes.serviceId) {
    const newService = await medicalServiceRepository.findById(
      changes.serviceId,
    );

    if (
      !DOCTOR_CHANGE_VALIDATION_RULES.SERVICE_CHANGE.ALLOWED_CATEGORIES.includes(
        newService.category,
      )
    ) {
      errors.push("Este tipo de servicio requiere aprobación especial");
    }

    // Check price difference
    const currentService = await medicalServiceRepository.findById(
      request.serviceId,
    );
    const priceDifference =
      (Math.abs(newService.price - currentService.price) /
        currentService.price) *
      100;

    if (
      priceDifference >
      DOCTOR_CHANGE_VALIDATION_RULES.SERVICE_CHANGE.MAX_PRICE_DIFFERENCE
    ) {
      warnings.push(
        "La diferencia de precio es significativa - justifique el cambio",
      );
    }
  }

  // Validate duration
  if (changes.duration !== undefined) {
    if (changes.duration < DOCTOR_CHANGE_VALIDATION_RULES.DURATION_CHANGE.MIN) {
      errors.push(
        `La duración mínima es ${DOCTOR_CHANGE_VALIDATION_RULES.DURATION_CHANGE.MIN} minutos`,
      );
    }
    if (changes.duration > DOCTOR_CHANGE_VALIDATION_RULES.DURATION_CHANGE.MAX) {
      errors.push(
        `La duración máxima es ${DOCTOR_CHANGE_VALIDATION_RULES.DURATION_CHANGE.MAX} minutos`,
      );
    }
  }

  // Validate price adjustment
  if (changes.priceAdjustment !== undefined) {
    if (
      changes.priceAdjustment <
      DOCTOR_CHANGE_VALIDATION_RULES.PRICE_ADJUSTMENT.MIN
    ) {
      errors.push(
        `El descuento máximo es ${Math.abs(DOCTOR_CHANGE_VALIDATION_RULES.PRICE_ADJUSTMENT.MIN)}%`,
      );
    }
    if (
      changes.priceAdjustment >
      DOCTOR_CHANGE_VALIDATION_RULES.PRICE_ADJUSTMENT.MAX
    ) {
      errors.push(
        `El aumento máximo es ${DOCTOR_CHANGE_VALIDATION_RULES.PRICE_ADJUSTMENT.MAX}%`,
      );
    }

    if (Math.abs(changes.priceAdjustment) > 30) {
      warnings.push(
        "Ajuste de precio significativo - proporcione justificación",
      );

      if (
        Math.abs(changes.priceAdjustment) >
        DOCTOR_CHANGE_VALIDATION_RULES.PRICE_ADJUSTMENT.AUTO_APPROVE_RANGE[1]
      ) {
        suggestions.push("Considere dividir el ajuste en cambios más pequeños");
      }
    }
  }

  // Validate notes
  if (changes.notes) {
    if (
      changes.notes.length < DOCTOR_CHANGE_VALIDATION_RULES.NOTES.MIN_LENGTH
    ) {
      errors.push(
        `Las notas deben tener al menos ${DOCTOR_CHANGE_VALIDATION_RULES.NOTES.MIN_LENGTH} caracteres`,
      );
    }
    if (
      changes.notes.length > DOCTOR_CHANGE_VALIDATION_RULES.NOTES.MAX_LENGTH
    ) {
      errors.push(
        `Las notas no pueden exceder ${DOCTOR_CHANGE_VALIDATION_RULES.NOTES.MAX_LENGTH} caracteres`,
      );
    }

    // Check for prohibited words
    const hasProhibitedWords =
      DOCTOR_CHANGE_VALIDATION_RULES.NOTES.PROHIBITED_WORDS.some((word) =>
        changes.notes!.toLowerCase().includes(word.toLowerCase()),
      );

    if (hasProhibitedWords) {
      errors.push("Las notas no deben contener lenguaje promocional");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    suggestions,
  };
};
```

## 4. API Endpoints for Editing

```typescript
// packages/api/src/routes/doctor/edit-request.ts
import { Elysia } from "elysia";
import { DoctorEditingService } from "../../services/business/doctor-editing-service";

export const editRequestRoutes = new Elysia({ prefix: "/doctor/edit" })
  .use(authenticateDoctor)
  .use(DoctorEditingService)

  /**
   * GET /doctor/edit/request/:id
   * Get editable data for a request
   */
  .get("/request/:id", async ({ params, doctor, doctorEditingService }) => {
    try {
      const data = await doctorEditingService.getEditableRequestData(
        params.id,
        doctor.id,
      );

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  })

  /**
   * POST /doctor/edit/validate
   * Validate proposed changes
   */
  .post("/validate", async ({ body, doctor, doctorEditingService }) => {
    try {
      const { requestId, changes } = body;

      const request =
        await doctorEditingService.reservationRequestRepository.findById(
          requestId,
        );

      const validation = await doctorEditingService.validateChanges(
        request,
        changes,
        doctor,
      );

      return {
        success: true,
        validation,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  })

  /**
   * POST /doctor/edit/apply-and-approve
   * Apply changes and approve request
   */
  .post(
    "/apply-and-approve",
    async ({ body, doctor, doctorEditingService }) => {
      try {
        const { requestId, changes } = body;

        const result = await doctorEditingService.applyChangesAndApprove(
          requestId,
          doctor.id,
          changes,
        );

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
        };
      }
    },
  )

  /**
   * GET /doctor/edit/statistics
   * Get editing statistics for doctor
   */
  .get("/statistics", async ({ doctor, doctorEditingService }) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const stats = await doctorEditingService.getEditingStatistics(doctor.id, {
        start: thirtyDaysAgo,
        end: new Date(),
      });

      return {
        success: true,
        statistics: stats,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  });
```

## 🎯 Success Metrics

### Editing System KPIs

- **Average editing time**: < 3 minutes
- **Validation accuracy**: > 95%
- **Doctor adoption rate**: > 80%
- **Change approval rate**: > 90%
- **Patient satisfaction with changes**: > 4.5/5

### Quality Metrics

- **Change validation success rate**: > 98%
- **Error prevention rate**: > 95%
- **Conflict resolution time**: < 2 minutes
- **Doctor feedback response**: > 85% positive

## 🔄 Integration Points

### With Slot State Service

- Changes trigger slot state updates
- Time slot changes validated against availability
- Duration changes checked against slot capacity

### With Inngest Workflows

- State changes trigger notification workflows
- Approval with changes triggers confirmation workflows
- Change logging for audit trails

### With Notification Service

- Patient notifications about changes
- Doctor confirmations of successful edits
- System notifications for major changes

**Phase 4: Pre-confirmation Editing - Complete implementation ready** ✅
