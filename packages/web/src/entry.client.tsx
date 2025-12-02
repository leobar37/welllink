import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

// React Grab for development - enables element selection for AI assistants
if (import.meta.env.DEV) {
  import("react-grab");
}

hydrateRoot(
  document,
  <StrictMode>
    <HydratedRouter />
  </StrictMode>,
);
