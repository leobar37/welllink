import { edenTreaty } from "@elysiajs/eden";
import type { App } from "../../../api/src/index";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5300/api";

export const api = edenTreaty<App>(API_URL, {
  $fetch: {
    credentials: "include",
  },
});
