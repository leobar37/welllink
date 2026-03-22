import { rateLimit } from "elysia-rate-limit";

export const agentRateLimit = () =>
  rateLimit({
    max: 20,
    duration: 60000,
    errorResponse: "Too many requests, please try again later.",
  });

export const agentStreamRateLimit = () =>
  rateLimit({
    max: 10,
    duration: 60000,
    errorResponse: "Too many streaming requests, please try again later.",
  });
