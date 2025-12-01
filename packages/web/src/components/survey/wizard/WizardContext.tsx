import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import type {
  HealthSurveyFormData,
  PersonalDataForm,
  MeasurementsForm,
  ConditionsForm,
  HabitsForm,
  ConditionCategory,
} from "@/lib/survey/schema"
import { TOTAL_STEPS, STEPS } from "@/lib/survey/constants"
import {
  saveSurveyDraft,
  loadSurveyDraft,
  clearSurveyDraft,
  generateSessionId,
  type SurveyDraft,
} from "@/lib/survey/storage"

// Initial form data
const initialFormData: Partial<HealthSurveyFormData> = {
  personalData: {
    visitorName: "",
    visitorPhone: "",
    visitorEmail: "",
    visitorWhatsapp: "",
    referredBy: "",
  },
  measurements: {
    weight: 0,
    height: 0,
    age: 0,
  },
  conditions: {
    digestive: [],
    cardiovascular: [],
    energy: [],
    immune: [],
    muscular: [],
    hormonal: [],
    skin: [],
    other: [],
  },
  habits: {
    waterIntake: "",
    training: undefined as unknown as "yes" | "no" | "sometimes",
    nutrition: undefined as unknown as "yes" | "no" | "regular",
    familyHistory: "",
  },
  metadata: {
    version: "1.0.0",
  },
}

// State interface
interface WizardState {
  currentStep: number
  data: Partial<HealthSurveyFormData>
  sessionId: string
  isSubmitting: boolean
  isSubmitted: boolean
  error: string | null
}

// Action types
type WizardAction =
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "GO_TO_STEP"; payload: number }
  | { type: "UPDATE_PERSONAL_DATA"; payload: Partial<PersonalDataForm> }
  | { type: "UPDATE_MEASUREMENTS"; payload: Partial<MeasurementsForm> }
  | { type: "TOGGLE_CONDITION"; payload: { category: ConditionCategory; condition: string } }
  | { type: "UPDATE_HABITS"; payload: Partial<HabitsForm> }
  | { type: "RESTORE_DRAFT"; payload: SurveyDraft }
  | { type: "SET_SUBMITTING"; payload: boolean }
  | { type: "SET_SUBMITTED" }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" }

// Reducer
function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "NEXT_STEP":
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS - 1),
      }

    case "PREV_STEP":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
      }

    case "GO_TO_STEP":
      return {
        ...state,
        currentStep: Math.max(0, Math.min(action.payload, TOTAL_STEPS - 1)),
      }

    case "UPDATE_PERSONAL_DATA":
      return {
        ...state,
        data: {
          ...state.data,
          personalData: {
            ...state.data.personalData,
            ...action.payload,
          } as PersonalDataForm,
        },
      }

    case "UPDATE_MEASUREMENTS":
      return {
        ...state,
        data: {
          ...state.data,
          measurements: {
            ...state.data.measurements,
            ...action.payload,
          } as MeasurementsForm,
        },
      }

    case "TOGGLE_CONDITION": {
      const { category, condition } = action.payload
      const currentConditions = state.data.conditions?.[category] ?? []
      const isSelected = currentConditions.includes(condition)
      const newConditions = isSelected
        ? currentConditions.filter((c: string) => c !== condition)
        : [...currentConditions, condition]

      return {
        ...state,
        data: {
          ...state.data,
          conditions: {
            ...state.data.conditions,
            [category]: newConditions,
          } as ConditionsForm,
        },
      }
    }

    case "UPDATE_HABITS":
      return {
        ...state,
        data: {
          ...state.data,
          habits: {
            ...state.data.habits,
            ...action.payload,
          } as HabitsForm,
        },
      }

    case "RESTORE_DRAFT":
      return {
        ...state,
        currentStep: action.payload.currentStep,
        data: action.payload.data,
      }

    case "SET_SUBMITTING":
      return {
        ...state,
        isSubmitting: action.payload,
        error: action.payload ? null : state.error,
      }

    case "SET_SUBMITTED":
      return {
        ...state,
        isSubmitting: false,
        isSubmitted: true,
      }

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isSubmitting: false,
      }

    case "RESET":
      return {
        currentStep: 0,
        data: initialFormData,
        sessionId: generateSessionId(),
        isSubmitting: false,
        isSubmitted: false,
        error: null,
      }

    default:
      return state
  }
}

// Context value interface
interface WizardContextValue {
  state: WizardState
  // Navigation
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  // Data updates
  updatePersonalData: (data: Partial<PersonalDataForm>) => void
  updateMeasurements: (data: Partial<MeasurementsForm>) => void
  toggleCondition: (category: ConditionCategory, condition: string) => void
  updateHabits: (data: Partial<HabitsForm>) => void
  // Draft management
  restoreDraft: (draft: SurveyDraft) => void
  // Submission
  setSubmitting: (isSubmitting: boolean) => void
  setSubmitted: () => void
  setError: (error: string | null) => void
  reset: () => void
  // Computed values
  percentage: number
  canGoBack: boolean
  canSkip: boolean
  currentStepConfig: (typeof STEPS)[number]
}

// Create context
const WizardContext = createContext<WizardContextValue | null>(null)

// Provider props
interface WizardProviderProps {
  children: ReactNode
  username: string
}

// Provider component
export function WizardProvider({ children, username }: WizardProviderProps) {
  const [state, dispatch] = useReducer(wizardReducer, {
    currentStep: 0,
    data: initialFormData,
    sessionId: generateSessionId(),
    isSubmitting: false,
    isSubmitted: false,
    error: null,
  })

  // Save to localStorage on step change
  useEffect(() => {
    if (state.currentStep > 0 && !state.isSubmitted) {
      saveSurveyDraft(username, state.currentStep, state.data)
    }
  }, [state.currentStep, state.data, state.isSubmitted, username])

  // Clear draft on successful submission
  useEffect(() => {
    if (state.isSubmitted) {
      clearSurveyDraft()
    }
  }, [state.isSubmitted])

  // Actions
  const nextStep = useCallback(() => dispatch({ type: "NEXT_STEP" }), [])
  const prevStep = useCallback(() => dispatch({ type: "PREV_STEP" }), [])
  const goToStep = useCallback(
    (step: number) => dispatch({ type: "GO_TO_STEP", payload: step }),
    []
  )
  const updatePersonalData = useCallback(
    (data: Partial<PersonalDataForm>) =>
      dispatch({ type: "UPDATE_PERSONAL_DATA", payload: data }),
    []
  )
  const updateMeasurements = useCallback(
    (data: Partial<MeasurementsForm>) =>
      dispatch({ type: "UPDATE_MEASUREMENTS", payload: data }),
    []
  )
  const toggleCondition = useCallback(
    (category: ConditionCategory, condition: string) =>
      dispatch({ type: "TOGGLE_CONDITION", payload: { category, condition } }),
    []
  )
  const updateHabits = useCallback(
    (data: Partial<HabitsForm>) =>
      dispatch({ type: "UPDATE_HABITS", payload: data }),
    []
  )
  const restoreDraft = useCallback(
    (draft: SurveyDraft) => dispatch({ type: "RESTORE_DRAFT", payload: draft }),
    []
  )
  const setSubmitting = useCallback(
    (isSubmitting: boolean) =>
      dispatch({ type: "SET_SUBMITTING", payload: isSubmitting }),
    []
  )
  const setSubmitted = useCallback(
    () => dispatch({ type: "SET_SUBMITTED" }),
    []
  )
  const setError = useCallback(
    (error: string | null) => dispatch({ type: "SET_ERROR", payload: error }),
    []
  )
  const reset = useCallback(() => dispatch({ type: "RESET" }), [])

  // Computed values
  const percentage = Math.round((state.currentStep / (TOTAL_STEPS - 1)) * 100)
  const canGoBack = state.currentStep > 0
  const currentStepConfig = STEPS[state.currentStep]
  const canSkip = currentStepConfig?.isSkippable ?? false

  const value: WizardContextValue = {
    state,
    nextStep,
    prevStep,
    goToStep,
    updatePersonalData,
    updateMeasurements,
    toggleCondition,
    updateHabits,
    restoreDraft,
    setSubmitting,
    setSubmitted,
    setError,
    reset,
    percentage,
    canGoBack,
    canSkip,
    currentStepConfig,
  }

  return (
    <WizardContext.Provider value={value}>{children}</WizardContext.Provider>
  )
}

// Hook to use wizard context
export function useWizard() {
  const context = useContext(WizardContext)
  if (!context) {
    throw new Error("useWizard must be used within a WizardProvider")
  }
  return context
}

// Hook to check for existing draft
export function useSurveyDraft(username: string) {
  const draft = loadSurveyDraft(username)
  return {
    hasDraft: draft !== null,
    draft,
  }
}
