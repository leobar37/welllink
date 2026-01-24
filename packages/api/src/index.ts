// Load environment variables FIRST, before any imports that need them
import { config } from "dotenv";
config({ path: ".env" });

// Import centralized env config
import { env } from "./config/env";

import { Elysia, redirect } from "elysia";
import { cors } from "@elysiajs/cors";
import { setDefaultResultOrder } from "node:dns";

// Force IPv4 preference to avoid IPv6 connection issues in Docker/Cloud environments
// This fixes ECONNREFUSED errors when connecting to databases like Supabase
setDefaultResultOrder("ipv4first");

import { auth } from "./lib/auth";
import { getCorsOrigins } from "./config/cors";

// Plugins
import { servicesPlugin } from "./plugins/services";
import { authPlugin } from "./plugins/auth";

// Middleware
import { errorMiddleware } from "./middleware/error";

// Routes
import { authRoutes } from "./api/routes/auth";
import { profileRoutes } from "./api/routes/profiles";
import { healthSurveyRoutes } from "./api/routes/health-survey";
import { assetRoutes } from "./api/routes/assets";
import { analyticsRoutes } from "./api/routes/analytics";

import { uploadRoutes } from "./api/routes/upload";
import { onboardingRoutes } from "./api/routes/onboarding";
import { publicRoutes } from "./api/routes/public";
import { qrRoutes } from "./api/routes/qr";
import { socialLinkRoutes } from "./api/routes/social-links";
import { themeRoutes } from "./api/routes/themes";
import { reservationRoutes } from "./api/routes/reservations";
import { aiRecommendationRoutes } from "./api/routes/ai-recommendation";
import { whatsappRoutes } from "./api/routes/whatsapp";
import { clientRoutes } from "./api/routes/client";
import { medicalServiceRoutes } from "./api/routes/medical-services";
import { availabilityRoutes } from "./api/routes/availability";
import { slotsRoutes } from "./api/routes/slots";
import { agentRoutes } from "./api/routes/agent";
import { agentConfigRoutes } from "./api/routes/agent-config";
import { paymentMethodRoutes } from "./api/routes/payment-methods";
import { whatsappAgentWebhook } from "./services/ai/whatsapp-agent/webhooks";
import { createStorageStrategy } from "./services/storage";

// Test routes - ONLY enabled via ENABLE_TEST_ROUTES=true (SECURITY: never in production)
const enableTestRoutes = env.ENABLE_TEST_ROUTES === "true";
const testRoutes = enableTestRoutes
  ? (await import("./api/routes/test")).testRoutes
  : null;

// Inngest
import { serve } from "inngest/bun";
import { inngest } from "./lib/inngest-client";
import { functions } from "./inngest";

const modules = [
  { id: "02", name: "Public Profile" },
  { id: "03", name: "Themes" },
  { id: "04", name: "Feature System" },
  { id: "05", name: "QR & Virtual Card" },
  { id: "06", name: "Dashboard" },
  { id: "07", name: "Settings" },
];

const app = new Elysia()
  // CORS - configurable via CORS_ORIGIN env variable
  .use(
    cors({
      origin: getCorsOrigins(),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  // File serving route for uploaded assets
  .get("/api/files/:path", async ({ params, set }) => {
    try {
      const storageService = await createStorageStrategy();
      await storageService.initialize();

      // If using Supabase, redirect to public URL (more efficient)
      const provider = env.STORAGE_PROVIDER || "local";
      if (provider === "supabase") {
        const publicUrl = storageService.getPublicUrl(params.path);
        // Use inline redirect instead
        return redirect(publicUrl);
      }

      // For local storage, serve the file directly
      const blob = await storageService.download(params.path);

      // Set appropriate content type based on file extension
      const ext = params.path.split(".").pop()?.toLowerCase();
      let contentType = "application/octet-stream";

      switch (ext) {
        case "jpg":
        case "jpeg":
          contentType = "image/jpeg";
          break;
        case "png":
          contentType = "image/png";
          break;
        case "webp":
          contentType = "image/webp";
          break;
        case "gif":
          contentType = "image/gif";
          break;
      }

      return new Response(blob, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000", // 1 year
        },
      });
    } catch (error) {
      console.warn(
        "File serving not available (storage not configured):",
        error instanceof Error ? error.message : error,
      );
      set.status = 404;
      return { error: "File not found" };
    }
  })
  // Core middleware
  .use(errorMiddleware)
  // Mount Better Auth handler (handles all /api/auth/* routes internally)
  .mount(auth.handler)
  // API Routes with /api prefix
  .group("/api", (api) =>
    api
      .use(servicesPlugin)
      .use(authPlugin)
      .get("/health", () => ({ status: "ok", service: "wellness-api" }))
      .get("/modules", () => modules)
      .use(authRoutes)
      .use(profileRoutes)
      .use(healthSurveyRoutes)
      .use(assetRoutes)
      .use(analyticsRoutes)
      .use(uploadRoutes)
      .use(onboardingRoutes)
      .use(publicRoutes)
      .use(qrRoutes)
      .use(socialLinkRoutes)
      .use(themeRoutes)
      .use(reservationRoutes)
      .use(aiRecommendationRoutes)
      .use(whatsappRoutes)
      .use(clientRoutes)
      .use(medicalServiceRoutes)
      .use(availabilityRoutes)
      .use(slotsRoutes)
      .use(agentRoutes)
      .use(agentConfigRoutes)
      .use(whatsappAgentWebhook)
      .use(paymentMethodRoutes)
      // Test routes - ONLY enabled via ENABLE_TEST_ROUTES=true (SECURITY: never in production)
      .use(
        enableTestRoutes
          ? testRoutes!
          : new Elysia({ name: "noop" }).derive(() => ({})),
      ),
  )
  // Inngest serve endpoint for workflow orchestration
  .all("/api/inngest", ({ request }) =>
    serve({ client: inngest, functions })(request),
  )
  .listen({
    port: Number(env.PORT),
    hostname: "0.0.0.0",
  });

export type App = typeof app;
export * from "./db/schema";

console.log(
  `🦊 Wellness API ready on http://${app.server?.hostname}:${app.server?.port}`,
);
