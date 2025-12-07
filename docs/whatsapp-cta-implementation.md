# WhatsApp CTA Feature - Implementation Summary

## Backend Changes ✅

### 1. Schema Updated (`packages/api/src/db/schema/profile.ts`)

Added `whatsappCta` to `FeaturesConfig` interface:

```typescript
export interface FeaturesConfig {
  healthSurvey?: {
    enabled: boolean;
    buttonText: string;
  };
  tuHistoria?: {
    enabled: boolean;
    buttonText: string;
  };
  whatsappCta?: {
    enabled: boolean;
    buttonText: string;
  };
}
```

### 2. Endpoint Validation (`packages/api/src/api/routes/profiles.ts`)

Updated `PATCH /:id/features-config` endpoint to accept `whatsappCta`:

```typescript
whatsappCta: t.Optional(
  t.Object({
    enabled: t.Boolean(),
    buttonText: t.String({ maxLength: 100 }),
  }),
),
```

### 3. Service Layer (`packages/api/src/services/business/profile.ts`)

No changes needed - the existing `updateFeaturesConfig` method already handles the merge correctly.

## Frontend Integration Guide

### Display Logic

The WhatsApp CTA button should ONLY be displayed when:

1. `profile.featuresConfig.whatsappCta?.enabled === true` **AND**
2. `profile.whatsappNumber` exists and is not empty

### Default Values

- **enabled**: `false` (feature disabled by default)
- **buttonText**: `"Escríbeme por WhatsApp"`

### API Usage Example

#### Update WhatsApp CTA config:

```typescript
// Enable WhatsApp CTA
await api.patch(`/profiles/${profileId}/features-config`, {
  whatsappCta: {
    enabled: true,
    buttonText: "¡Contáctame ahora!",
  },
});

// Disable WhatsApp CTA
await api.patch(`/profiles/${profileId}/features-config`, {
  whatsappCta: {
    enabled: false,
    buttonText: "Escríbeme por WhatsApp",
  },
});
```

### Component Implementation Example

```tsx
import { useProfile } from "@/hooks/use-profile";

export function WhatsAppCTA() {
  const { profile } = useProfile();

  // Don't render if feature is disabled or no WhatsApp number
  if (
    !profile?.featuresConfig?.whatsappCta?.enabled ||
    !profile?.whatsappNumber
  ) {
    return null;
  }

  const whatsappUrl = `https://wa.me/${profile.whatsappNumber.replace(/\D/g, "")}`;
  const buttonText =
    profile.featuresConfig.whatsappCta.buttonText || "Escríbeme por WhatsApp";

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-whatsapp"
    >
      <WhatsAppIcon />
      {buttonText}
    </a>
  );
}
```

### Settings Panel Implementation

```tsx
export function WhatsAppSettings() {
  const { profile, updateFeaturesConfig } = useProfile();
  const [enabled, setEnabled] = useState(
    profile?.featuresConfig?.whatsappCta?.enabled ?? false,
  );
  const [buttonText, setButtonText] = useState(
    profile?.featuresConfig?.whatsappCta?.buttonText ??
      "Escríbeme por WhatsApp",
  );

  const handleSave = async () => {
    await updateFeaturesConfig({
      whatsappCta: { enabled, buttonText },
    });
  };

  return (
    <div className="settings-section">
      <h3>WhatsApp CTA</h3>

      {!profile?.whatsappNumber && (
        <Alert variant="warning">
          Debes configurar tu número de WhatsApp en el perfil antes de habilitar
          esta función.
        </Alert>
      )}

      <Switch
        checked={enabled}
        onChange={setEnabled}
        disabled={!profile?.whatsappNumber}
        label="Mostrar botón de WhatsApp"
      />

      <Input
        value={buttonText}
        onChange={(e) => setButtonText(e.target.value)}
        maxLength={100}
        disabled={!enabled}
        label="Texto del botón"
      />

      <Button onClick={handleSave}>Guardar</Button>
    </div>
  );
}
```

## Testing Checklist

- [ ] Backend compiles without TypeScript errors ✅
- [ ] Endpoint accepts `whatsappCta` in request body ✅
- [ ] Service merges config correctly ✅
- [ ] Frontend displays button only when enabled AND whatsappNumber exists
- [ ] Frontend hides button when disabled OR whatsappNumber is missing
- [ ] Settings panel shows warning when whatsappNumber is not configured
- [ ] Button text can be customized (max 100 chars)
- [ ] WhatsApp link opens correctly with proper phone number format

## Database Migration

No migration needed - the `featuresConfig` field already exists as `jsonb`, which allows adding new properties without schema changes.

## Notes

- The feature follows the exact same pattern as `healthSurvey` and `tuHistoria`
- TypeScript strict mode is maintained
- No breaking changes to existing features
- Backend is fully implemented and tested ✅
