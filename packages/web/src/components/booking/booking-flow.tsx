import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ServiceSelector } from "./service-selector";
import { DateTimePicker } from "./date-time-picker";
import { BookingForm } from "./booking-form";
import { BookingSummary } from "./booking-summary";
import type { MedicalService } from "@/lib/types";
import type { BookingData } from "@/hooks/use-booking";
import { useBooking } from "@/hooks/use-booking";

interface BookingFlowProps {
  username: string;
  profileId: string;
  services: MedicalService[];
  onBookingComplete?: () => void;
}

export function BookingFlow({
  username,
  profileId,
  services,
  onBookingComplete,
}: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<MedicalService | null>(
    null,
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [patientData, setPatientData] = useState<Partial<BookingData>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<{
    requestId: string;
    expiresAt: string;
  } | null>(null);

  const bookingMutation = useBooking();

  const handleServiceSelect = (service: MedicalService) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleFormSubmit = (data: Partial<BookingData>) => {
    setPatientData(data);
    setStep(4);
  };

  const handleConfirmBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    setSubmitError(null);

    const dateStr = selectedDate.toISOString().split("T")[0];
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const bookingData: BookingData = {
      profileId,
      serviceId: selectedService.id,
      preferredDate: dateStr,
      preferredTime: selectedTime,
      timezone,
      patientName: patientData.patientName || "",
      patientPhone: patientData.patientPhone || "",
      patientEmail: patientData.patientEmail,
      patientAge: patientData.patientAge,
      patientGender: patientData.patientGender,
      chiefComplaint: patientData.chiefComplaint,
      symptoms: patientData.symptoms,
      medicalHistory: patientData.medicalHistory,
      currentMedications: patientData.currentMedications,
      allergies: patientData.allergies,
      urgencyLevel: patientData.urgencyLevel,
      metadata: patientData.metadata,
    };

    bookingMutation.mutate(bookingData, {
      onSuccess: (result) => {
        setBookingSuccess({
          requestId: result.request.id,
          expiresAt: result.request.expiresAt.toISOString(),
        });
        onBookingComplete?.();
      },
      onError: (error: any) => {
        setSubmitError(
          error.message ||
            "Error al procesar tu solicitud. Por favor intenta de nuevo.",
        );
      },
    });
  };

  const steps = [
    { number: 1, title: "Selecciona un servicio" },
    { number: 2, title: "Selecciona fecha y hora" },
    { number: 3, title: "Tus datos" },
    { number: 4, title: "Confirmación" },
  ];

  const progress = (step / steps.length) * 100;

  const canProceedToStep3 = selectedDate && selectedTime;

  return (
    <div data-testid="booking-flow" className="space-y-6">
      <div data-testid="progress-section" className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span data-testid="step-indicator" className="font-medium">
            Paso {step} de {steps.length}
          </span>
          <span data-testid="progress-text" className="text-muted-foreground">
            {Math.round(progress)}% completado
          </span>
        </div>
        <Progress data-testid="progress-bar" value={progress} />

        <div data-testid="steps-container" className="flex justify-between">
          {steps.map((s) => (
            <div
              key={s.number}
              data-testid={`step-${s.number}`}
              className="flex flex-col items-center gap-1"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s.number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s.number ? <Check className="h-4 w-4" /> : s.number}
              </div>
              <span className="text-xs text-muted-foreground hidden md:block">
                {s.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div data-testid="step-1-content">
          <div className="mb-4">
            <h2 data-testid="step-1-title" className="text-2xl font-bold">
              Selecciona un servicio
            </h2>
            <p
              data-testid="step-1-description"
              className="text-muted-foreground"
            >
              Elige el tipo de consulta que necesitas
            </p>
          </div>
          <ServiceSelector
            services={services}
            selectedService={selectedService || undefined}
            onSelect={handleServiceSelect}
          />
        </div>
      )}

      {step === 2 && selectedService && (
        <div data-testid="step-2-content">
          <div className="mb-4">
            <h2 data-testid="step-2-title" className="text-2xl font-bold">
              Selecciona fecha y hora
            </h2>
            <p
              data-testid="step-2-description"
              className="text-muted-foreground"
            >
              Indica tu preferencia para: {selectedService.name}
            </p>
          </div>

          <DateTimePicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateChange={setSelectedDate}
            onTimeChange={setSelectedTime}
          />

          <div
            data-testid="step-2-actions"
            className="flex justify-between mt-6"
          >
            <Button
              data-testid="btn-back"
              variant="outline"
              onClick={() => setStep(1)}
            >
              Atrás
            </Button>
            <Button
              data-testid="btn-next"
              disabled={!canProceedToStep3}
              onClick={() => setStep(3)}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {step === 3 && selectedService && selectedDate && selectedTime && (
        <div data-testid="step-3-content">
          <div className="mb-4">
            <h2 data-testid="step-3-title" className="text-2xl font-bold">
              Tus datos
            </h2>
            <p
              data-testid="step-3-description"
              className="text-muted-foreground"
            >
              Ingresa tu información para contactarte
            </p>
          </div>
          <BookingForm
            onSubmit={handleFormSubmit}
            onCancel={() => setStep(2)}
          />
        </div>
      )}

      {step === 4 &&
        selectedService &&
        selectedDate &&
        selectedTime &&
        patientData && (
          <div data-testid="step-4-content">
            <div className="mb-4">
              <h2 data-testid="step-4-title" className="text-2xl font-bold">
                Confirma tu cita
              </h2>
              <p
                data-testid="step-4-description"
                className="text-muted-foreground"
              >
                Revisa los detalles antes de enviar
              </p>
            </div>

            <BookingSummary
              service={selectedService}
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              patientData={patientData}
            />

            {submitError && (
              <div
                data-testid="booking-error"
                className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4"
              >
                {submitError}
              </div>
            )}

            {bookingSuccess && (
              <div
                data-testid="booking-success"
                className="bg-green-500/10 text-green-600 p-4 rounded-lg mb-4"
              >
                <p data-testid="success-message" className="font-medium">
                  ¡Solicitud enviada exitosamente!
                </p>
                <p data-testid="request-id" className="text-sm mt-1">
                  Tu código de solicitud es:{" "}
                  <strong>{bookingSuccess.requestId}</strong>
                </p>
                <p className="text-sm mt-1">
                  El profesional confirmará tu cita pronto. Te enviaremos una
                  notificación cuando sea confirmada.
                </p>
              </div>
            )}

            <div
              data-testid="step-4-actions"
              className="flex justify-between mt-4"
            >
              <Button
                data-testid="btn-back"
                variant="outline"
                onClick={() => setStep(3)}
                disabled={bookingMutation.isPending || !!bookingSuccess}
              >
                Atrás
              </Button>
              {!bookingSuccess ? (
                <Button
                  data-testid="btn-submit"
                  onClick={handleConfirmBooking}
                  disabled={bookingMutation.isPending}
                >
                  {bookingMutation.isPending
                    ? "Enviando..."
                    : "Enviar Solicitud"}
                </Button>
              ) : (
                <Button data-testid="btn-back-to-profile" asChild>
                  <a href={`/${username}`}>Volver al perfil</a>
                </Button>
              )}
            </div>
          </div>
        )}
    </div>
  );
}
