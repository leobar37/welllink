import type { HealthSurveyFormData, ConditionCategory } from "./schema"
import { CATEGORY_META } from "./constants"

/**
 * Format training value to Spanish
 */
function formatTraining(value: "yes" | "no" | "sometimes"): string {
  const map = { yes: "Sí", no: "No", sometimes: "A veces" }
  return map[value] || value
}

/**
 * Format nutrition value to Spanish
 */
function formatNutrition(value: "yes" | "no" | "regular"): string {
  const map = { yes: "Sí", no: "No", regular: "Regular" }
  return map[value] || value
}

/**
 * Generate WhatsApp message from survey data
 * Format follows the PRD specification
 */
export function generateWhatsAppMessage(data: HealthSurveyFormData): string {
  const { personalData, measurements, conditions, habits } = data

  // Collect all conditions with their category labels
  const allConditions: string[] = []
  const categoryOrder: ConditionCategory[] = [
    "digestive",
    "cardiovascular",
    "energy",
    "immune",
    "muscular",
    "hormonal",
    "skin",
    "other",
  ]

  for (const category of categoryOrder) {
    const categoryConditions = conditions[category] || []
    if (categoryConditions.length > 0) {
      const meta = CATEGORY_META[category]
      allConditions.push(`\n*${meta.icon} ${meta.friendlyName}*`)
      categoryConditions.forEach((c: string) => allConditions.push(`• ${c}`))
    }
  }

  const totalConditions = categoryOrder.reduce(
    (sum, cat) => sum + (conditions[cat]?.length || 0),
    0
  )

  // Build message parts
  const parts: string[] = []

  // Header
  parts.push("🌿 *PROCESO DE TRANSFORMACIÓN 7 DÍAS*")
  parts.push("")

  // Personal data
  parts.push("👤 *Datos Personales*")
  parts.push(`Nombre: ${personalData.visitorName}`)
  if (personalData.visitorPhone) {
    parts.push(`Teléfono: ${personalData.visitorPhone}`)
  }
  if (personalData.visitorEmail) {
    parts.push(`Email: ${personalData.visitorEmail}`)
  }
  if (personalData.referredBy) {
    parts.push(`Invitado por: ${personalData.referredBy}`)
  }
  parts.push("")

  // Measurements
  parts.push("📊 *Medidas*")
  parts.push(`Peso: ${measurements.weight} kg`)
  parts.push(`Estatura: ${measurements.height} cm`)
  parts.push(`Edad: ${measurements.age} años`)
  parts.push("")

  // Conditions
  parts.push(`🩺 *Condiciones de Salud (${totalConditions})*`)
  if (totalConditions > 0) {
    parts.push(allConditions.join("\n"))
  } else {
    parts.push("• Ninguna reportada")
  }
  parts.push("")

  // Habits
  parts.push("🏃 *Hábitos*")
  parts.push(`Agua diaria: ${habits.waterIntake}`)
  parts.push(`Entrena: ${formatTraining(habits.training)}`)
  parts.push(`Alimentación: ${formatNutrition(habits.nutrition)}`)

  // Family history (if provided)
  if (habits.familyHistory) {
    parts.push("")
    parts.push("👨‍👩‍👧 *Historial Familiar*")
    parts.push(habits.familyHistory)
  }

  return parts.join("\n")
}

/**
 * Generate WhatsApp deep link
 * @param phone Phone number (will be cleaned of non-numeric characters)
 * @param message Message to send
 */
export function generateWhatsAppLink(phone: string, message: string): string {
  // Remove any non-numeric characters except + at the beginning
  const cleanPhone = phone.replace(/[^\d+]/g, "").replace(/^\+/, "")
  const encodedMessage = encodeURIComponent(message)

  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`
}

/**
 * Open WhatsApp with the survey message
 */
export function openWhatsApp(phone: string, data: HealthSurveyFormData): void {
  const message = generateWhatsAppMessage(data)
  const link = generateWhatsAppLink(phone, message)
  window.open(link, "_blank")
}
