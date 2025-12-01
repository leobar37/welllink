import type { ConditionCategory } from "./schema"

// Category metadata with friendly names and icons
export const CATEGORY_META: Record<
  ConditionCategory,
  { title: string; friendlyName: string; icon: string; description: string }
> = {
  digestive: {
    title: "Digestivo",
    friendlyName: "Tu digestión",
    icon: "🫃",
    description: "¿Cómo se siente tu sistema digestivo?",
  },
  cardiovascular: {
    title: "Cardiovascular",
    friendlyName: "Corazón y circulación",
    icon: "❤️",
    description: "¿Cómo está tu corazón y tu energía vital?",
  },
  energy: {
    title: "Energía y Sueño",
    friendlyName: "Descanso y vitalidad",
    icon: "⚡",
    description: "¿Cómo duermes y cómo te sientes durante el día?",
  },
  immune: {
    title: "Sistema Inmune",
    friendlyName: "Tus defensas",
    icon: "🛡️",
    description: "¿Con qué frecuencia te enfermas?",
  },
  muscular: {
    title: "Muscular y Óseo",
    friendlyName: "Huesos y músculos",
    icon: "🦴",
    description: "¿Cómo se sienten tus articulaciones?",
  },
  hormonal: {
    title: "Hormonal / Reproductivo",
    friendlyName: "Equilibrio hormonal",
    icon: "🌙",
    description: "¿Cómo está tu ciclo y equilibrio interno?",
  },
  skin: {
    title: "Piel y Estética",
    friendlyName: "Piel, cabello y uñas",
    icon: "✨",
    description: "¿Cómo luce y se siente tu piel?",
  },
  other: {
    title: "Otros",
    friendlyName: "Otros síntomas",
    icon: "🩺",
    description: "¿Algo más que debamos saber?",
  },
}

// Conditions per category (from PRD docs/feature-1-evaluation.md)
export const CONDITIONS: Record<ConditionCategory, string[]> = {
  digestive: [
    "Reflujo gástrico",
    "Gastritis",
    "Estreñimiento/diarrea",
    "Inflamación del colon",
    "Hinchazón estomacal",
    "Gases",
    "Hemorroides",
    "Hernia hiatal",
    "Hígado graso",
  ],
  cardiovascular: [
    "Presión alta",
    "Colesterol alto",
    "Triglicéridos",
    "Mala circulación",
    "Problemas del corazón",
    "Anemia",
  ],
  energy: [
    "Problemas para dormir",
    "Falta de energía",
    "Mareos",
    "Calambres",
    "Hipoglicemia",
  ],
  immune: [
    "Gripas frecuentes",
    "Defensas bajas",
    "Alergias",
    "Asma",
    "Rinitis o sinusitis",
  ],
  muscular: [
    "Dolor de articulaciones",
    "Dolor de espalda",
    "Osteoporosis",
    "Fibromialgia",
  ],
  hormonal: [
    "Cólicos menstruales",
    "Periodos irregulares",
    "Ovarios poliquísticos",
    "Diabetes",
  ],
  skin: [
    "Problemas de piel",
    "Caída del cabello",
    "Uñas débiles",
    "Celulitis",
  ],
  other: [
    "Dolores de cabeza",
    "Ansiedad",
    "Visión borrosa",
    "Mal aliento",
    "Infección urinaria",
    "Orina oscura/fuerte",
    "Retención de líquidos",
    "Consumo de medicamentos",
  ],
}

// Category order for the wizard steps
export const CATEGORY_ORDER: ConditionCategory[] = [
  "digestive",
  "cardiovascular",
  "energy",
  "immune",
  "muscular",
  "hormonal",
  "skin",
  "other",
]

// Training options
export const TRAINING_OPTIONS = [
  { value: "yes" as const, label: "Sí" },
  { value: "no" as const, label: "No" },
  { value: "sometimes" as const, label: "A veces" },
]

// Nutrition options
export const NUTRITION_OPTIONS = [
  { value: "yes" as const, label: "Sí" },
  { value: "no" as const, label: "No" },
  { value: "regular" as const, label: "Regular" },
]

// Step definitions for the wizard
export const STEPS = [
  { id: "intro", title: "Bienvenido", isSkippable: false },
  { id: "personal", title: "Datos Personales", isSkippable: false },
  { id: "measurements", title: "Medidas", isSkippable: false },
  { id: "digestive", title: "Tu digestión", isSkippable: true },
  { id: "cardiovascular", title: "Corazón y circulación", isSkippable: true },
  { id: "energy", title: "Descanso y vitalidad", isSkippable: true },
  { id: "immune", title: "Tus defensas", isSkippable: true },
  { id: "muscular", title: "Huesos y músculos", isSkippable: true },
  { id: "hormonal", title: "Equilibrio hormonal", isSkippable: true },
  { id: "skin", title: "Piel, cabello y uñas", isSkippable: true },
  { id: "other", title: "Otros síntomas", isSkippable: true },
  { id: "habits", title: "Hábitos", isSkippable: false },
  { id: "summary", title: "Resumen", isSkippable: false },
] as const

export const TOTAL_STEPS = STEPS.length
