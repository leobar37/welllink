import { Elysia } from "elysia";
import { auth } from "../lib/auth";
import type { RequestContext } from "../types/context";

export const authPlugin = new Elysia({ name: "auth" }).derive(
  { as: "global" },
  async ({ request }) => {
    // Extract session from Better Auth cookies
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    // Build context from session
    const ctx: RequestContext | null = session?.user
      ? {
          userId: session.user.id,
          email: session.user.email,
          role: (session.user as { role?: string }).role || "user",
        }
      : null;

    return {
      ctx,
      auth,
    };
  },
);
