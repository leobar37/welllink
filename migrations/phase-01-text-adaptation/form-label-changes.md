# Form Label Changes - Wellness to Medical

## Profile Setup Forms

### Basic Information Section

#### Before: Wellness Labels

```tsx
{
  fullName: "Full Name",
  wellnessTitle: "Your Wellness Title",
  wellnessDescription: "Describe your wellness approach",
  healthFocus: "Primary Health Focus",
  wellnessGoals: "What wellness goals do you help clients achieve?",
  lifestyleApproach: "Your lifestyle approach"
}
```

#### After: Medical Labels

```tsx
{
  fullName: "Doctor Name / Medical Professional",
  medicalTitle: "Your Medical Title (Dr., MD, etc.)",
  medicalDescription: "Describe your medical expertise and approach",
  clinicalSpecialty: "Primary Medical Specialty",
  medicalServices: "What medical services do you provide?",
  treatmentApproach: "Your treatment philosophy"
}
```

### Contact & Practice Information

#### Before: Wellness Contact

```tsx
{
  wellnessCenter: "Wellness Center Name",
  wellnessAddress: "Wellness Practice Address",
  wellnessPhone: "Wellness Contact Phone",
  wellnessEmail: "Wellness Contact Email",
  consultationType: "Type of Wellness Consultation"
}
```

#### After: Medical Contact

```tsx
{
  clinicName: "Clinic / Practice Name",
  clinicAddress: "Medical Practice Address",
  clinicPhone: "Practice Contact Phone",
  clinicEmail: "Practice Contact Email",
  consultationType: "Type of Medical Consultation",
  medicalLicense: "Medical License Number",
  specialtyCertification: "Board Certification"
}
```

### Services & Pricing Forms

#### Before: Wellness Services

```tsx
{
  wellnessServices: "Wellness Services Offered",
  healthPackages: "Health & Wellness Packages",
  lifestylePrograms: "Lifestyle Modification Programs",
  holisticApproach: "Holistic Health Approach",
  wellnessCoaching: "Wellness Coaching Sessions",
  energyHealing: "Energy Healing Services"
}
```

#### After: Medical Services

```tsx
{
  medicalServices: "Medical Services Offered",
  consultationTypes: "Types of Medical Consultations",
  treatmentPlans: "Treatment Plan Options",
  medicalProcedures: "Medical Procedures Available",
  diagnosticServices: "Diagnostic Services",
  followUpCare: "Follow-up Care Plans",
  preventiveCare: "Preventive Care Services"
}
```

## Patient Registration Forms

### Personal Information

#### Before: Health Survey

```tsx
{
  healthGoals: "What are your health goals?",
  wellnessObjectives: "Your wellness objectives",
  lifestyleHabits: "Current lifestyle habits",
  healthChallenges: "Health challenges you face",
  wellnessHistory: "Previous wellness experiences"
}
```

#### After: Medical Intake

```tsx
{
  medicalConcerns: "What medical concerns do you have?",
  treatmentGoals: "Your treatment objectives",
  medicalHistory: "Relevant medical history",
  currentSymptoms: "Current symptoms or conditions",
  previousTreatments: "Previous medical treatments",
  currentMedications: "Current medications",
  allergies: "Known allergies or reactions"
}
```

### Medical History Section

#### Before: Wellness History

```tsx
{
  wellnessJourney: "Tell us about your wellness journey",
  healthMilestones: "Important health milestones",
  lifestyleChanges: "Lifestyle changes you've made",
  wellnessAchievements: "Your wellness achievements",
  healthSetbacks: "Health setbacks you've experienced"
}
```

#### After: Clinical History

```tsx
{
  medicalHistory: "Tell us about your medical history",
  diagnosisHistory: "Previous medical diagnoses",
  treatmentHistory: "Medical treatments you've received",
  surgicalHistory: "Previous surgeries or procedures",
  familyHistory: "Family medical history",
  socialHistory: "Social habits and lifestyle factors"
}
```

## Appointment Booking Forms

### Booking Information

#### Before: Wellness Booking

```tsx
{
  wellnessConsultation: "Type of wellness consultation",
  healthService: "Health service needed",
  wellnessGoal: "Primary wellness goal",
  lifestyleFocus: "Lifestyle focus area",
  energyLevel: "Current energy level (1-10)",
  stressLevel: "Stress level (1-10)",
  sleepQuality: "Sleep quality (1-10)"
}
```

#### After: Medical Booking

```tsx
{
  consultationType: "Type of medical consultation",
  medicalService: "Medical service needed",
  chiefComplaint: "Primary medical concern",
  symptomDuration: "How long have you had symptoms?",
  painLevel: "Pain level (1-10)",
  urgencyLevel: "How urgent is this appointment?",
  preferredTime: "Preferred appointment time",
  insuranceProvider: "Insurance provider",
  policyNumber: "Insurance policy number"
}
```

### Scheduling Preferences

#### Before: Wellness Schedule

```tsx
{
  wellnessSchedule: "Preferred wellness schedule",
  healthRoutine: "Current health routine",
  lifestyleCompatibility: "Lifestyle compatibility",
  wellnessAvailability: "Availability for wellness activities",
  energyPatterns: "Energy patterns throughout day"
}
```

#### After: Medical Schedule

```tsx
{
  appointmentSchedule: "Preferred appointment schedule",
  medicalUrgency: "Urgency of medical need",
  scheduleFlexibility: "Schedule flexibility",
  availability: "Availability for medical appointments",
  transportation: "Transportation arrangements",
  workSchedule: "Work schedule constraints"
}
```

## Settings and Preferences Forms

### Notification Settings

#### Before: Wellness Notifications

```tsx
{
  wellnessReminders: "Wellness activity reminders",
  healthTips: "Health and wellness tips",
  lifestyleAlerts: "Lifestyle improvement alerts",
  wellnessGoals: "Wellness goal progress updates",
  motivationMessages: "Motivational messages"
}
```

#### After: Medical Notifications

```tsx
{
  appointmentReminders: "Appointment reminders",
  medicalAlerts: "Medical appointment alerts",
  prescriptionReminders: "Prescription refill reminders",
  testResults: "Test result notifications",
  followUpReminders: "Follow-up care reminders",
  medicalUpdates: "Medical practice updates"
}
```

### Privacy Settings

#### Before: Wellness Privacy

```tsx
{
  wellnessData: "Share wellness data with advisors",
  healthInformation: "Health information visibility",
  lifestyleData: "Lifestyle tracking data",
  wellnessProgress: "Wellness progress sharing",
  achievementSharing: "Achievement sharing preferences"
}
```

#### After: Medical Privacy

```tsx
{
  medicalRecords: "Share medical records with providers",
  patientData: "Patient data visibility",
  clinicalInformation: "Clinical information sharing",
  testResults: "Test result sharing preferences",
  medicalHistory: "Medical history access",
  insuranceInformation: "Insurance information sharing"
}
```

## Error Messages and Validation

### Before: Wellness Errors

```tsx
{
  wellnessRequired: "Wellness goals are required",
  healthInvalid: "Please enter valid health information",
  lifestyleRequired: "Lifestyle preferences required",
  wellnessIncomplete: "Complete your wellness profile"
}
```

### After: Medical Errors

```tsx
{
  medicalSpecialtyRequired: "Medical specialty is required",
  clinicalInvalid: "Please enter valid clinical information",
  treatmentRequired: "Treatment preferences required",
  medicalLicenseInvalid: "Please enter a valid medical license number",
  specialtyRequired: "Medical specialty required",
  insuranceInvalid: "Please enter valid insurance information",
  medicalHistoryRequired: "Medical history is required"
}
```

## Placeholder Text Changes

### Input Placeholders

#### Before: Wellness Placeholders

```tsx
{
  wellnessGoals: "Ej: Bajar de peso, mejorar energía...",
  healthDescription: "Describe tu enfoque de salud...",
  lifestyleApproach: "Cuéntanos sobre tu estilo de vida...",
  wellnessPhilosophy: "Tu filosofía de bienestar..."
}
```

#### After: Medical Placeholders

```tsx
{
  medicalSpecialty: "Ej: Cardiología, Medicina General...",
  clinicalDescription: "Describe tu enfoque clínico...",
  treatmentApproach: "Cuéntanos sobre tu filosofía de tratamiento...",
  medicalPhilosophy: "Tu filosofía médica...",
  symptoms: "Describe tus síntomas principales...",
  medicalHistory: "Historia médica relevante...",
  currentMedications: "Listado de medicamentos actuales..."
}
```

## Implementation Priority

1. **High Priority**: Profile setup forms, patient registration
2. **Medium Priority**: Appointment booking, settings forms
3. **Low Priority**: Validation messages, placeholders

## Files to Update

- Profile form components
- Patient registration forms
- Appointment booking interfaces
- Settings and preferences forms
- Validation schemas and error messages
- Input placeholder definitions
