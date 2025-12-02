import { Elysia } from "elysia";
import { auth } from "../lib/auth";
import type { RequestContext } from "../types/context";

export const authPlugin = new Elysia({ name: "auth" }).derive(
  { as: "global" },
  async ({ request }) => {
    try {
      // Extract session from Better Auth cookies
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      console.log("Session found:", !!session);
      console.log("User found:", !!session?.user);

      if (!session?.user) {
        // Return null ctx, authGuard will handle rejection
        return {
          ctx: null,
          auth,
        };
      }

      // Build context from session
      const ctx: RequestContext = {
        userId: session.user.id,
        email: session.user.email,
        role: (session.user as { role?: string }).role || "user",
      };

      console.log("Created ctx with userId:", ctx.userId);

      return {
        ctx,
        auth,
      };
    } catch (error) {
      console.error("Auth plugin error:", error);
      return {
        ctx: null,
        auth,
      };
    }
  },
);
