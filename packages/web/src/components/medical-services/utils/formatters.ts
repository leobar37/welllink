/**
 * Utilidades de formato para servicios médicos
 */

/**
 * Formatea la duración de minutos a formato legible
 * @param minutes Duración en minutos
 * @returns Duración formateada (ej: "30 minutos", "1 hora 30 minutos")
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minuto" : "minutos"}`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} ${hours === 1 ? "hora" : "horas"}`;
  }

  return `${hours} ${hours === 1 ? "hora" : "horas"} ${remainingMinutes} ${remainingMinutes === 1 ? "minuto" : "minutos"}`;
}

/**
 * Formatea el precio a formato monetario
 * @param price Precio como string o número
 * @returns Precio formateado (ej: "$50.00")
 */
export function formatPrice(price: string | number | null | undefined): string {
  if (!price) return "";

  const numericPrice = typeof price === "string" ? parseFloat(price) : price;

  if (isNaN(numericPrice)) return "";

  return `$${numericPrice.toFixed(2)}`;
}

/**
 * Genera las opciones de duración para un select
 * @returns Array de opciones para duraciones comunes
 */
export function getDurationOptions(): { value: number; label: string }[] {
  return [
    { value: 15, label: "15 minutos" },
    { value: 30, label: "30 minutos" },
    { value: 45, label: "45 minutos" },
    { value: 60, label: "1 hora" },
    { value: 90, label: "1 hora 30 minutos" },
    { value: 120, label: "2 horas" },
  ];
}
