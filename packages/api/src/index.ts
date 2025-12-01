import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./lib/auth";

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

const modules = [
  { id: "02", name: "Public Profile" },
  { id: "03", name: "Themes" },
  { id: "04", name: "Feature System" },
  { id: "05", name: "QR & Virtual Card" },
  { id: "06", name: "Dashboard" },
  { id: "07", name: "Settings" },
];
console.log("env", process.env.NODE_ENV);
const devOrigins = ["http://localhost:5176", "http://localhost:5174"];

const app = new Elysia()
  // CORS - Open for development
  .use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://yourdomain.com"]
          : devOrigins, // Specific origins for development
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  )
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
      .use(storiesRoutes),
  )
  .listen(5300);

export type App = typeof app;
export * from "./db/schema";

console.log(
  `🦊 Wellness API ready on http://${app.server?.hostname}:${app.server?.port}`,
);
