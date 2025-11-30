import { Elysia } from "elysia";
import { z } from "zod";
import { authPlugin } from "../../plugins/auth";
import { errorMiddleware } from "../../middleware/error";
import { auth } from "../../lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
});

export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(errorMiddleware)
  .use(authPlugin)
  .post("/register", async ({ body, set }) => {
    const data = registerSchema.parse(body);

    try {
      const result = await auth.api.signUpEmail({
        body: {
          email: data.email,
          password: data.password,
          name: data.name,
        },
      });

      set.status = 201;
      return { user: result.user };
    } catch (error: unknown) {
      set.status = 400;
      const message =
        error instanceof Error ? error.message : "Registration failed";
      return { error: message };
    }
  })
  .post("/login", async ({ body, set, cookie }) => {
    const data = loginSchema.parse(body);

    try {
      const result = await auth.api.signInEmail({
        body: {
          email: data.email,
          password: data.password,
        },
      });

      // Set session cookie using token from response
      if (result.token && cookie.session) {
        cookie.session.value = result.token;
        cookie.session.httpOnly = true;
        cookie.session.secure = process.env.NODE_ENV === "production";
        cookie.session.sameSite = "lax";
        cookie.session.maxAge = 60 * 60 * 24 * 7; // 7 days
      }

      return { user: result.user, token: result.token };
    } catch (error: unknown) {
      set.status = 401;
      const message = error instanceof Error ? error.message : "Login failed";
      return { error: message };
    }
  })
  .post("/logout", async ({ cookie }) => {
    cookie.session?.remove();
    return { message: "Logged out successfully" };
  })
  .get("/me", async ({ ctx, set }) => {
    if (!ctx) {
      set.status = 401;
      return { error: "Not authenticated" };
    }

    return { user: { id: ctx.userId, email: ctx.email, role: ctx.role } };
  });
