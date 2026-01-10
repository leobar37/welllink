# UI Text Changes - Wellness to Medical

## Navigation & Header Changes

### Before: Wellness Navigation

- "My Wellness" → "My Practice" / "My Clinic"
- "Wellness Profile" → "Medical Profile"
- "Health Journey" → "Treatment Plans" / "Patient Care"
- "Wellness Insights" → "Medical Analytics" / "Practice Metrics"

### After: Medical Navigation

```tsx
// packages/web/src/components/navigation/main-nav.tsx
const navigationItems = [
  { label: "My Practice", href: "/dashboard" }, // Changed from "My Wellness"
  { label: "Medical Profile", href: "/profile" }, // Changed from "Wellness Profile"
  { label: "Patient Care", href: "/patients" }, // Changed from "Health Journey"
  { label: "Analytics", href: "/analytics" }, // Changed from "Wellness Insights"
];
```

## Dashboard Card Changes

### Before: Wellness Cards

```tsx
// Original wellness cards
{
  title: "Your Wellness Journey",
  description: "Track your health progress",
  icon: Heart
}
{
  title: "Health Survey Results",
  description: "View your wellness assessment",
  icon: ClipboardList
}
```

### After: Medical Cards

```tsx
// New medical cards
{
  title: "Your Medical Practice",
  description: "Manage your clinic operations",
  icon: Stethoscope
}
{
  title: "Patient Assessments",
  description: "Review patient intake forms",
  icon: FileText
}
{
  title: "Appointment Schedule",
  description: "View and manage bookings",
  icon: Calendar
}
{
  title: "Treatment Analytics",
  description: "Monitor practice performance",
  icon: TrendingUp
}
```

## Form Label Changes

### Profile Form Labels

```tsx
// Before: Wellness labels
{
  wellnessGoals: "What are your wellness goals?",
  healthFocus: "Primary health focus areas",
  wellnessApproach: "Your wellness philosophy"
}

// After: Medical labels
{
  medicalSpecialties: "What are your medical specialties?",
  clinicalFocus: "Primary clinical focus areas",
  treatmentApproach: "Your treatment philosophy",
  practiceType: "Type of medical practice"
}
```

### Patient Intake Form Labels

```tsx
// Before: Health survey
{
  healthConcerns: "What health concerns do you have?",
  wellnessGoals: "What are your wellness goals?",
  lifestyle: "Describe your current lifestyle"
}

// After: Medical intake
{
  medicalConcerns: "What medical concerns do you have?",
  treatmentGoals: "What are your treatment goals?",
  medicalHistory: "Describe your medical history",
  currentMedications: "List current medications"
}
```

## Button & Action Text

### Before: Wellness Actions

```tsx
// Original buttons
<Button>Create Wellness Plan</Button>
<Button>Start Health Journey</Button>
<Button>Share Wellness Card</Button>
<Button>View Wellness Tips</Button>
```

### After: Medical Actions

```tsx
// New medical buttons
<Button>Create Treatment Plan</Button>
<Button>Schedule Consultation</Button>
<Button>Share Medical Profile</Button>
<Button>View Treatment Protocols</Button>
<Button>Book Appointment</Button>
<Button>View Patient Records</Button>
```

## Page Title Changes

### Dashboard Titles

```tsx
// Before
<h1>Welcome to Your Wellness Dashboard</h1>
<h2>Your Wellness Journey Progress</h2>

// After
<h1>Welcome to Your Medical Practice Dashboard</h1>
<h2>Your Clinic Performance Metrics</h2>
```

### Profile Page Titles

```tsx
// Before
<h1>Your Wellness Profile</h1>
<h2>Health & Wellness Information</h2>

// After
<h1>Your Medical Professional Profile</h1>
<h2>Clinical & Practice Information</h2>
```

## Status and Progress Text

### Progress Indicators

```tsx
// Before: Wellness progress
{
  ("Completing your wellness profile...");
}
{
  ("Health journey started!");
}
{
  ("Wellness goals updated");
}

// After: Medical progress
{
  ("Completing your medical profile...");
}
{
  ("Practice setup complete!");
}
{
  ("Treatment protocols updated");
}
{
  ("Patient care goals updated");
}
```

## Empty State Messages

### Before: Wellness Empty States

```tsx
// Original empty states
{
  ("No wellness activities yet");
}
{
  ("Start your health journey");
}
{
  ("No wellness recommendations");
}
```

### After: Medical Empty States

```tsx
// New medical empty states
{
  ("No appointments scheduled");
}
{
  ("No patient consultations yet");
}
{
  ("No treatment protocols available");
}
{
  ("Start building your practice");
}
{
  ("No patient assessments pending");
}
```

## Settings and Configuration

### Profile Settings

```tsx
// Before: Wellness settings
{
  ("Wellness Preferences");
}
{
  ("Health Notification Settings");
}
{
  ("Wellness Data Privacy");
}

// After: Medical settings
{
  ("Practice Preferences");
}
{
  ("Patient Notification Settings");
}
{
  ("Medical Data Privacy");
}
{
  ("Clinical Notification Settings");
}
```

## Implementation Priority

1. **High Priority**: Navigation, main dashboard, profile forms
2. **Medium Priority**: Buttons, action text, status messages
3. **Low Priority**: Empty states, secondary UI elements

## Files to Update

- Navigation components (`main-nav.tsx`, `sidebar-nav.tsx`)
- Dashboard components (`dashboard.tsx`, `analytics.tsx`)
- Profile forms (`profile-form.tsx`, `onboarding-form.tsx`)
- Button components throughout the app
- Status and progress indicators
- Empty state components
- Settings pages
