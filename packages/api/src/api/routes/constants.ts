import { Elysia } from "elysia";
import { authGuard } from "../../middleware/auth-guard";
import { errorMiddleware } from "../../middleware/error";
import {
  SYSTEM_VARIABLES,
  VARIABLE_DESCRIPTIONS,
  ALL_SUPPORTED_VARIABLES,
} from "../../constants/template-variables";
import { DEFAULT_CAMPAIGN_TEMPLATES } from "../../constants/campaign-templates";

export const constantsRoutes = new Elysia({ prefix: "/constants" })
  .use(errorMiddleware)
  .use(authGuard)
  .get(
    "/variables",
    () => {
      const variables = ALL_SUPPORTED_VARIABLES.map((variable) => ({
        variable,
        description:
          VARIABLE_DESCRIPTIONS[variable] || "Variable personalizada",
      }));

      return {
        variables,
        systemVariables: SYSTEM_VARIABLES,
      };
    },
    {
      detail: {
        tags: ["Constants"],
        summary: "Get available template variables",
        description:
          "Returns all available template variables that can be used in messages",
      },
    },
  )
  .get(
    "/campaign-templates",
    () => {
      return {
        templates: DEFAULT_CAMPAIGN_TEMPLATES,
      };
    },
    {
      detail: {
        tags: ["Constants"],
        summary: "Get default campaign templates",
        description:
          "Returns default campaign templates that users can use as starting point",
      },
    },
  );
