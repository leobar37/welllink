import type { MedicalReservationEvents } from "../../types/inngest-events";
import { env } from "../../config/env";
import { EvolutionService } from "../../services/business/evolution-api";

export const evolutionService = new EvolutionService({
  baseUrl: env.EVOLUTION_API_URL,
  apiKey: env.EVOLUTION_API_KEY,
});

export interface InngestFunctionContext {
  step: {
    run: <T>(id: string, fn: () => Promise<T>) => Promise<T>;
    sendEvent: (name: string, data: Record<string, unknown>) => Promise<void>;
  };
  logger: {
    info: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
    debug: (...args: unknown[]) => void;
  };
}

export type EventContext<T extends keyof MedicalReservationEvents> =
  InngestFunctionContext & {
    event: { data: MedicalReservationEvents[T]["data"] };
  };
