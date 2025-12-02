import type { HealthSurveyFormData } from "./schema";

/**
 * Generate a simple WhatsApp greeting message after survey submission
 * The full survey data is already saved to the dashboard
 */
export function generateWhatsAppMessage(data: HealthSurveyFormData): string {
  const { personalData } = data;

  return `¡Hola! Soy ${personalData.visitorName}. He completado la encuesta de salud. 🌿`;
}

/**
 * Generate WhatsApp deep link
 * @param phone Phone number (will be cleaned of non-numeric characters)
 * @param message Message to send
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  // Remove any non-numeric characters except + at the beginning
  const cleanPhone = phone.replace(/[^\d+]/g, "").replace(/^\+/, "");
  const encodedMessage = encodeURIComponent(message);

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp with the survey message
 */
export function openWhatsApp(phone: string, data: HealthSurveyFormData): void {
  const message = generateWhatsAppMessage(data);
  const link = generateWhatsAppLink(phone, message);
  window.open(link, "_blank");
}
