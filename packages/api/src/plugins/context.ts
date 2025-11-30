import { Elysia } from "elysia";
import type { RequestContext } from "../types/context";

// Context decorator for dependency injection
export const contextPlugin = new Elysia({ name: "context" }).derive(
  { as: "global" },
  () => {
    // This will be overridden by auth plugin with actual user context
    return {
      ctx: null as RequestContext | null,
    };
  },
);
