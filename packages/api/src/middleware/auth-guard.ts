import { Elysia } from "elysia";
import { UnauthorizedException } from "../utils/http-exceptions";
import { authPlugin } from "../plugins/auth";
import type { RequestContext } from "../types/context";

export const authGuard = new Elysia({ name: "auth-guard" })
  .use(authPlugin)
  .derive({ as: "global" }, ({ ctx }) => {
    if (!ctx) {
      throw new UnauthorizedException("Authentication required");
    }
    return { ctx: ctx as RequestContext };
  });
