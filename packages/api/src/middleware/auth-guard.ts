import { Elysia } from "elysia";
import { UnauthorizedException } from "../utils/http-exceptions";
import { authPlugin } from "../plugins/auth";
import type { RequestContext } from "../types/context";

export const authGuard = new Elysia({ name: "auth-guard" })
  .use(authPlugin)
  .derive({ as: "scoped" }, ({ ctx }) => {
    if (!ctx) {
      throw new UnauthorizedException("No authentication context found");
    }
    if (!ctx.userId) {
      throw new UnauthorizedException("User not authenticated");
    }
    // ctx is already typed as RequestContext from authPlugin
    return { ctx };
  });
