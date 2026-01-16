import { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ServiceSelector } from "./service-selector";
import { SlotCalendar } from "./slot-calendar";
import { BookingForm } from "./booking-form";
import { BookingSummary } from "./booking-summary";
import type { MedicalService } from "@/lib/types";
import type { PublicSlot } from "@/hooks/use-booking";
import type { BookingData } from "@/hooks/use-booking";
import { usePublicSlots } from "@/hooks/use-booking";

interface BookingFlowProps {
  username: string;
  services: MedicalService[];
  onBookingComplete?: () => void;
}

export function BookingFlow({ username, services, onBookingComplete }: BookingFlowProps) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<MedicalService | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<PublicSlot | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [patientData, setPatientData] = useState<Partial<BookingData>>({});

  // Fetch slots when a service is selected
  const { data: slotsData, isLoading: slotsLoading } = usePublicSlots(
    username,
    selectedService?.id || "",
    selectedDate
  );

  const slots = slotsData?.slots || [];

  const handleServiceSelect = (service: MedicalService) => {
    setSelectedService(service);
    setStep(2);
  };

  const handleSlotSelect = (slot: PublicSlot) => {
    setSelectedSlot(slot);
  };

  const handleFormSubmit = (data: Partial<BookingData>) => {
    setPatientData(data);
    setStep(4);
  };

  const handleConfirmBooking = () => {
    if (!selectedService || !selectedSlot) return;

    const bookingData: BookingData = {
      slotId: selectedSlot.id,
      serviceId: selectedService.id,
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
    };

    // Here you would call the booking API
    console.log("Booking data:", bookingData);
    onBookingComplete?.();
  };

  const steps = [
    { number: 1, title: "Selecciona un servicio" },
    { number: 2, title: "Selecciona fecha y hora" },
    { number: 3, title: "Tus datos" },
    { number: 4, title: "Confirmación" },
  ];

  const progress = (step / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Paso {step} de {steps.length}</span>
          <span className="text-muted-foreground">{Math.round(progress)}% completado</span>
        </div>
        <Progress value={progress} />
        <div className="flex justify-between">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center gap-1">
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

      {/* Step Content */}
      {step === 1 && (
        <>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Selecciona un servicio</h2>
            <p className="text-muted-foreground">
              Elige el tipo de consulta que necesitas
            </p>
          </div>
          <ServiceSelector
            services={services}
            selectedService={selectedService || undefined}
            onSelect={handleServiceSelect}
          />
        </>
      )}

      {step === 2 && selectedService && (
        <>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Selecciona fecha y hora</h2>
            <p className="text-muted-foreground">
              Horarios disponibles para: {selectedService.name}
            </p>
          </div>
          <SlotCalendar
            slots={slots}
            isLoading={slotsLoading}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            selectedSlot={selectedSlot || undefined}
            onSlotSelect={handleSlotSelect}
          />
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setStep(1)}>
              Atrás
            </Button>
            <Button disabled={!selectedSlot} onClick={() => setStep(3)}>
              Siguiente
            </Button>
          </div>
        </>
      )}

      {step === 3 && selectedService && selectedSlot && (
        <>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Tus datos</h2>
            <p className="text-muted-foreground">
              Ingresa tu información para contactarte
            </p>
          </div>
          <BookingForm
            onSubmit={handleFormSubmit}
            onCancel={() => setStep(2)}
          />
        </>
      )}

      {step === 4 && selectedService && selectedSlot && patientData && (
        <>
          <div className="mb-4">
            <h2 className="text-2xl font-bold">Confirma tu cita</h2>
            <p className="text-muted-foreground">
              Revisa los detalles antes de enviar
            </p>
          </div>
          <BookingSummary
            service={selectedService}
            slot={selectedSlot}
            patientData={patientData}
          />
          <div className="flex justify-between mt-4">
            <Button variant="outline" onClick={() => setStep(3)}>
              Atrás
            </Button>
            <Button onClick={handleConfirmBooking}>
              Enviar Solicitud
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
