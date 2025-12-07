# Wellness Link - Backend Implementation Progress

## Module: Better Auth + Service Architecture + Assets + Onboarding

### ✅ Completed Tasks

#### 1. Dependencies & Configuration

- [x] Install `better-auth`, `@elysiajs/cors`, `drizzle-kit`, `zod`
- [x] Install `dotenv`, `date-fns` for additional functionality
- [x] Create `.env.example` with DATABASE_URL, BETTER_AUTH_SECRET, CORS_ORIGIN
- [x] Create `drizzle.config.ts` for migration management
- [x] Add `postgres` package for database connection

#### 2. Core Infrastructure

- [x] Create DB connection `src/db/index.ts`
- [x] Create Better Auth config `src/lib/auth.ts` (email/password + verification only)
- [x] Create `src/types/context.ts` - RequestContext interface (single-tenant)
- [x] Create `src/utils/http-exceptions.ts` - Custom exception classes
- [x] Create validation schemas for all endpoints

#### 3. Plugin System (Dependency Injection)

- [x] Create `src/plugins/context.ts` - RequestContext via decorators
- [x] Create `src/plugins/services.ts` - DI container (TypeScript inference)
- [x] Create `src/plugins/auth.ts` - Better Auth integration

#### 4. Middleware

- [x] Create `src/middleware/error.ts` - HTTP exception handling
- [x] Create `src/middleware/auth-guard.ts` - Session validation

#### 5. Repository Layer (Data Access)

- [x] Create `src/services/repository/profile.ts` - Profile CRUD operations
- [x] Create `src/services/repository/social-link.ts` - Social media links
- [x] Create `src/services/repository/health-survey.ts` - Survey responses + visitor data
- [x] Create `src/services/repository/asset.ts` - File storage management
- [x] Create `src/services/repository/analytics.ts` - Profile views, social clicks
- [x] All repositories use user-based filtering (no tenantId for single-tenant)

#### 6. Business Service Layer (Domain Logic)

- [x] Create `src/services/business/profile.ts` - Profile management with validation
- [x] Create `src/services/business/social-link.ts` - Social links + tracking
- [x] Create `src/services/business/health-survey.ts` - Survey processing + statistics
- [x] Create `src/services/business/asset.ts` - File upload/download + stats
- [x] Create `src/services/business/analytics.ts` - Analytics + reporting
- [x] Create `src/services/business/cdn.ts` - CDN service with optimization and transformations
- [x] Create `src/services/business/onboarding.ts` - User onboarding flow management
- [x] All services use constructor injection (DI pattern)

#### 7. API Routes

- [x] Create `src/api/routes/auth.ts` - Login, register, logout, verification
- [x] Create `src/api/routes/profiles.ts` - Profile CRUD + stats
- [x] Create `src/api/routes/health-survey.ts` - Survey endpoints
- [x] Create `src/api/routes/assets.ts` - File management routes
- [x] Create `src/api/routes/analytics.ts` - Tracking + analytics endpoints
- [x] Create `src/api/routes/upload.ts` - File upload with validation (single/multiple)
- [x] Create `src/api/routes/onboarding.ts` - User onboarding flow and progress
- [x] All routes use Zod validation + proper HTTP status codes

#### 8. Entry Point Configuration

- [x] Update `src/index.ts` - Port 5300
- [x] Configure CORS (open in development, configurable in production)
- [x] Register all plugins in correct order
- [x] Set up dependency injection container
- [x] Integrate Better Auth handler

### ✅ TypeScript Errors - RESOLVED

All TypeScript errors have been fixed:

- [x] **Table name mismatches**: Fixed `viewedAt`/`clickedAt` instead of `createdAt`
- [x] **Schema field alignment**: Using `username` instead of `slug`, `socialLink.platform` for clicks
- [x] **Type inference issues**: All `any` types replaced with proper DTOs
- [x] **Better Auth integration**: Using `.mount(auth.handler)` correctly
- [x] **Service registration**: All services registered in `plugins/services.ts`

### ✅ Type Safety - Implemented

#### DTOs Created (`src/types/dto.ts`)

- `CreateProfileData`, `UpdateProfileData`
- `CreateAssetData`, `CreateAssetWithPathData`, `UpdateAssetData`
- `CreateSocialLinkData`, `UpdateSocialLinkData`, `SocialPlatform`
- `ProfileCreationData`, `AvatarUploadData`, `SocialLinksData`, `ThemeData`
- `OnboardingStepPayload`, `OnboardingStepUpdateData`, `OnboardingExample`
- `CreateHealthSurveyData`, `UpdateHealthSurveyData`

#### Files Updated for Type Safety

- `services/business/profile.ts` - No more `any`
- `services/business/asset.ts` - No more `any`
- `services/business/social-link.ts` - No more `any`
- `services/business/onboarding.ts` - No more `any`
- `api/routes/upload.ts` - `z.custom<File>()` instead of `z.any()`
- `api/routes/onboarding.ts` - `z.record()` instead of `z.any()`

### 📋 Next Steps for Future Agents

#### Database Setup

1. **Create initial migration**: `bunx drizzle-kit generate`
2. **Run migrations**: `bunx drizzle-kit migrate`
3. **Verify schema**: Check all tables created correctly
4. **Test constraints**: Validate foreign keys and relations

#### Testing & Validation

1. **Unit tests**: Create tests for repositories and services
2. **Integration tests**: Test API endpoints
3. **Authentication flow**: Test login/register/logout
4. **Error handling**: Verify HTTP exceptions work correctly

#### Frontend Integration

1. **API client**: Set up frontend to communicate with backend
2. **Authentication**: Integrate Better Auth with frontend
3. **Type safety**: Share TypeScript types between packages
4. **CORS testing**: Verify frontend can access API

### 🏗️ Architecture Implemented

#### Pattern Following (bun-elysia Skill)

- ✅ **Constructor DI**: All services receive dependencies via constructor
- ✅ **RequestContext**: Single-tenant context injection via decorators
- ✅ **HttpExceptions**: No wrapper responses, proper status codes
- ✅ **Repository Pattern**: Data access layer separation
- ✅ **Service Layer**: Business logic separation
- ✅ **Plugin System**: Elysia plugins for DI and context
- ✅ **Middleware**: Error handling and auth guards

#### Single-Tenant Adaptation

- ✅ **No tenantId filtering**: Simplified for single application
- ✅ **User-based access**: Users can only access their own data
- ✅ **Context structure**: `{ userId, email, role }` only

#### Better Auth Integration

- ✅ **Email/password only**: No social providers currently
- ✅ **Email verification**: Required for account activation
- ✅ **Session management**: Secure cookie-based sessions
- ✅ **Drizzle adapter**: Direct integration with existing schema

### 📊 Implementation Statistics

#### Files Created: 30+

- **Configuration**: 4 files (.env.example, drizzle.config.ts, etc.)
- **Infrastructure**: 4 files (db connection, auth config, etc.)
- **Plugins**: 3 files (context, services, auth)
- **Middleware**: 2 files (error, auth-guard)
- **Repositories**: 5 files (data access layer)
- **Services**: 7 files (business logic layer + CDN + Onboarding)
- **Routes**: 7 files (API endpoints + Upload + Onboarding)
- **Types**: 1 file (RequestContext)
- **Utilities**: 1 file (HTTP exceptions)

#### Dependencies Added: 8

- `better-auth`, `@elysiajs/cors`, `drizzle-kit`, `zod`
- `dotenv`, `date-fns`, `postgres` (already had `drizzle-orm`)

#### API Endpoints: 25+

- **Auth**: 6 endpoints (register, login, logout, me, verify-email, forgot-password)
- **Profiles**: 5 endpoints (CRUD + stats)
- **Health Survey**: 5 endpoints (CRUD + stats)
- **Assets**: 6 endpoints (CRUD + upload + file access)
- **Analytics**: 6 endpoints (views, clicks, overall stats)
- **Upload**: 3 endpoints (single file, multiple files, delete)
- **Onboarding**: 6 endpoints (progress, step update, tips, skip, reset, checklist)

### 🔄 Current Status

**Completion**: 100% Backend Structure Complete

**Blockers**: None - All TypeScript errors resolved

**Priority**: Database migrations and frontend integration

**Ready for**: Testing and frontend development

---

## Frontend Implementation Progress

### ✅ Completed - Core Architecture & Dashboard

#### 1. Infrastructure

- [x] Setup React Router v7 with Layouts (`AuthLayout`, `DashboardLayout`, `PublicLayout`)
- [x] Configure Type-safe API client (`edenTreaty`)
- [x] Implement Responsive Design System (`useBreakpoint`, `ResponsiveDialog`, `shadcn/ui`)
- [x] Integrate `better-auth` client for session management

#### 2. Authentication & Onboarding

- [x] Implement Login Page with form validation
- [x] Implement Register Page with form validation
- [x] Implement Onboarding Wizard (4 steps: Welcome, Profile, Avatar, Socials, Completion)
- [x] Connect Onboarding state to backend API

#### 3. Dashboard Features

- [x] **Overview**: Real-time stats fetching (Views, Clicks)
- [x] **Edit Profile**: Profile form with Avatar upload
- [x] **Features**: Toggle system for enabling/disabling modules
- [x] **QR Tools**: QR Code generation and Virtual Card download (`html-to-image`)
- [x] **Settings**: Password management and Sign out

#### 4. Public Profile

- [x] Dynamic profile routing `/:username`
- [x] Public data fetching via Eden Treaty
- [x] Mobile-first design for "Link-in-bio" experience

### 🚧 In Progress / Missing

#### 1. Data Fetching Optimization

- [ ] Install & Configure **TanStack Query** (currently using raw `useEffect`)
- [ ] Refactor `DashboardOverview`, `EditProfile`, `QRTools` to use `useQuery`
- [ ] Implement optimistic updates for toggles and form submissions

#### 2. Health Survey Feature (Module 04)

- [ ] **Visitor View**: Public-facing survey form (`/s/:surveyId` or modal)
- [ ] **Dashboard View**: List of received survey responses
- [ ] **Response Detail**: View individual survey answers

#### 3. Backend Integration Gaps

- [ ] Connect Frontend QR Tools to Backend QR API (`/api/qr/*`) instead of client-side generation
- [ ] Implement "Appointments" feature placeholder

---

## Storage Strategy Implementation (Latest Update)

### ✅ Completed - Supabase Storage Integration

#### New Files Created

- `src/services/storage/storage.interface.ts` - StorageStrategy interface
- `src/services/storage/supabase.storage.ts` - Supabase Storage implementation
- `src/services/storage/local.storage.ts` - Local filesystem implementation (for dev)
- `src/services/storage/index.ts` - Factory function + exports

#### Modified Files

- `src/services/business/asset.ts` - Uses StorageStrategy via DI
- `src/services/business/cdn.ts` - Uses StorageStrategy for URLs
- `src/services/repository/asset.ts` - Fixed table name (`asset` not `assets`)
- `src/plugins/services.ts` - Initializes storage + injects into services
- `src/api/routes/assets.ts` - Returns public URLs from storage
- `src/api/routes/upload.ts` - Uses storage strategy for uploads
- `src/db/schema/asset.ts` - Added `type` field
- `.env.example` - Added Supabase configuration variables

#### New Dependencies

- `@supabase/supabase-js` v2.86.0

#### Environment Variables

```env
STORAGE_PROVIDER=local|supabase
STORAGE_BUCKET=wellness-assets
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
API_BASE_URL=http://localhost:5300
```

#### Features

- **Strategy Pattern**: Easy to switch between local and Supabase storage
- **Auto-bucket creation**: Bucket is created automatically if it doesn't exist
- **Public URLs**: `getPublicUrl()` for public assets
- **Signed URLs**: `getSignedUrl()` for temporary access
- **File validation**: Size limits and MIME type validation
- **Path structure**: `{userId}/files/` or `{userId}/assets/`

#### Usage

```typescript
// Upload returns public URL
POST /api/upload { file, type: "avatar" }
// Response: { id, filename, url: "https://xxx.supabase.co/storage/v1/..." }

// Get signed URL for temporary access
GET /api/assets/:id/signed-url?expiresIn=3600
```

---

## Module 05: QR & Virtual Card Implementation

### ✅ Completed - QR Code & Virtual Card System

#### New Files Created

- `src/services/business/qr.ts` - QR code generation service (PNG/SVG)
- `src/services/business/card.ts` - Virtual card data service
- `src/api/routes/qr.ts` - QR and card API endpoints

#### Modified Files

- `src/db/schema/analytics.ts` - Added `qrDownload` table for tracking
- `src/db/schema/relations.ts` - Added QR download relations
- `src/services/repository/analytics.ts` - Added QR download tracking methods
- `src/index.ts` - Registered QR routes
- `package.json` - Added `qrcode` dependency

#### New Dependencies

- `qrcode` v1.5.4

#### Database Schema

```sql
-- New table for QR download tracking
CREATE TABLE qr_download (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  format VARCHAR(10) NOT NULL, -- 'png' or 'svg'
  downloaded_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

#### API Endpoints

| Method | Endpoint                               | Auth | Description                       |
| ------ | -------------------------------------- | ---- | --------------------------------- |
| GET    | `/api/qr/public/:username`             | No   | Get QR code by username           |
| GET    | `/api/qr/public/:username/card`        | No   | Get virtual card data by username |
| GET    | `/api/qr/profiles/:profileId`          | Yes  | Get QR code for owned profile     |
| GET    | `/api/qr/profiles/:profileId/download` | Yes  | Download QR as file (PNG/SVG)     |
| GET    | `/api/qr/profiles/:profileId/card`     | Yes  | Get virtual card data for profile |

#### Query Parameters

```typescript
// QR generation options
{
  format: "png" | "svg",  // Default: "png"
  width: number,          // 100-1000, Default: 300
  margin: number,         // 0-10, Default: 2
  darkColor: string,      // Hex color, Default: "#000000"
  lightColor: string      // Hex color, Default: "#ffffff"
}

// Card options
{
  includeQR: boolean,        // Default: true
  includeSocialLinks: boolean, // Default: true
  qrSize: number             // 50-300, Default: 150
}
```

#### Features

- **QR Generation**: PNG and SVG formats with customizable colors and sizes
- **Virtual Card**: Structured data with profile info, social links, and embedded QR
- **Download Tracking**: Analytics for QR downloads by format
- **Public Access**: QR and card data accessible without authentication
- **High Resolution**: Download endpoint provides 600px QR for printing

#### Response Examples

```typescript
// GET /api/qr/profiles/:id
{
  qrCode: "data:image/png;base64,...",
  format: "png",
  mimeType: "image/png",
  profileUrl: "https://wellnesslink.com/username"
}

// GET /api/qr/profiles/:id/card
{
  profile: {
    username: "john",
    displayName: "John Doe",
    title: "Wellness Coach",
    bio: "Helping you live better",
    avatarUrl: "https://..."
  },
  socialLinks: [
    { platform: "instagram", url: "https://..." }
  ],
  qrCodeDataUrl: "data:image/png;base64,...",
  profileUrl: "https://wellnesslink.com/john"
}
```

#### Environment Variables

```env
PUBLIC_URL=https://wellnesslink.com  # Base URL for QR codes
```

---

## WhatsApp CTA Feature Configuration

### ✅ Completed - WhatsApp Call-to-Action Feature

#### Modified Files

- `src/db/schema/profile.ts` - Extended `FeaturesConfig` interface with `whatsappCta`
- `src/api/routes/profiles.ts` - Added validation for `whatsappCta` in features-config endpoint
- `src/services/business/profile.ts` - No changes needed (already handles merge correctly)

#### Documentation Created

- `docs/whatsapp-cta-implementation.md` - Complete implementation guide for frontend
- `test-whatsapp-cta.sh` - Test script for API endpoints

#### Schema Changes

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

#### API Endpoint

```typescript
PATCH /api/profiles/:id/features-config
{
  "whatsappCta": {
    "enabled": boolean,
    "buttonText": string (max 100 chars)
  }
}
```

#### Default Values

- `enabled`: `false` (disabled by default)
- `buttonText`: `"Escríbeme por WhatsApp"`

#### Display Logic

The WhatsApp CTA button should only be displayed when:

1. `profile.featuresConfig.whatsappCta?.enabled === true` **AND**
2. `profile.whatsappNumber` exists and is not empty

#### Validation

- ✅ TypeScript compiles without errors in modified files
- ✅ Schema validation added for `whatsappCta` (optional field)
- ✅ `buttonText` max length: 100 characters
- ✅ Pattern consistent with existing features (`healthSurvey`, `tuHistoria`)
- ✅ Server imports successfully
- ✅ No migration needed (jsonb field allows new properties)

#### Frontend Next Steps

1. Create `WhatsAppCTA` component in `components/public-profile/`
2. Add WhatsApp settings panel in dashboard
3. Update `use-profile` hook if needed for features config
4. Add integration tests

---

_Last Updated: 2025-12-07_
_Agent: Claude - WhatsApp CTA Feature Configuration_
