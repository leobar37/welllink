import { edenTreaty } from "@elysiajs/eden";
import type { App } from "@wellness/api";

export const api = edenTreaty<App>("http://localhost:5300", {
  $fetch: {
    credentials: "include",
  },
});
