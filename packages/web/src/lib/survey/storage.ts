import type { HealthSurveyFormData } from "./schema"

const STORAGE_KEY = "wellness-survey-draft"
const EXPIRY_HOURS = 24

export interface SurveyDraft {
  username: string
  currentStep: number
  data: Partial<HealthSurveyFormData>
  timestamp: number
}

/**
 * Save survey draft to localStorage
 */
export function saveSurveyDraft(
  username: string,
  currentStep: number,
  data: Partial<HealthSurveyFormData>
): void {
  try {
    const draft: SurveyDraft = {
      username,
      currentStep,
      data,
      timestamp: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch (error) {
    // Silent fail - localStorage might be full or disabled
    console.warn("Failed to save survey draft:", error)
  }
}

/**
 * Load survey draft from localStorage
 * Returns null if no draft exists, is expired, or is for a different user
 */
export function loadSurveyDraft(username: string): SurveyDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const draft: SurveyDraft = JSON.parse(raw)

    // Check if expired (24 hours)
    const expiryMs = EXPIRY_HOURS * 60 * 60 * 1000
    const isExpired = Date.now() - draft.timestamp > expiryMs
    if (isExpired) {
      clearSurveyDraft()
      return null
    }

    // Check if same username
    if (draft.username !== username) {
      return null
    }

    return draft
  } catch (error) {
    console.warn("Failed to load survey draft:", error)
    return null
  }
}

/**
 * Check if a draft exists for the given username
 */
export function hasSurveyDraft(username: string): boolean {
  return loadSurveyDraft(username) !== null
}

/**
 * Clear survey draft from localStorage
 */
export function clearSurveyDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn("Failed to clear survey draft:", error)
  }
}

/**
 * Generate a unique session ID for analytics tracking
 */
export function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}
