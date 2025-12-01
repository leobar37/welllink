import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "http://localhost:5300", // Matches the API server port
  fetchOptions: {
    credentials: "include",
  },
});
