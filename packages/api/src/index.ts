// Load environment variables FIRST, before any imports that need them
import { config } from "dotenv";
config({ path: ".env" });

import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { setDefaultResultOrder } from "node:dns";

// Force IPv4 preference to avoid IPv6 connection issues in Docker/Cloud environments
// This fixes ECONNREFUSED errors when connecting to databases like Supabase
setDefaultResultOrder("ipv4first");

import { auth } from "./lib/auth";
import { getAllowedOrigins } from "./config/cors";

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
import { storiesRoutes } from "./api/routes/stories";
import { themeRoutes } from "./api/routes/themes";
import { aiRecommendationRoutes } from "./api/routes/ai-recommendation";
import { LocalStorageStrategy } from "./services/storage/local.storage";

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
      origin: getAllowedOrigins(),
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
  // File serving route for uploaded assets
  .get("/api/files/:path", async ({ params, set }) => {
    try {
      const storageService = new LocalStorageStrategy();
      await storageService.initialize();

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
      .use(storiesRoutes)
      .use(themeRoutes)
      .use(aiRecommendationRoutes),
  )
  .listen({
    port: Number(process.env.PORT) || 5300,
    hostname: "0.0.0.0",
  });

export type App = typeof app;
export * from "./db/schema";

console.log(
  `🦊 Wellness API ready on http://${app.server?.hostname}:${app.server?.port}`,
);
