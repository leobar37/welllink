import { Inngest } from "inngest";
import type { MedicalReservationEvents } from "../types/inngest-events";
import { env } from "../config/env";

export const inngest = new Inngest({
  id: env.INNGEST_APP_ID,
  name: "Medical Chatbot Platform",
  eventKey: env.INNGEST_EVENT_KEY,
  baseUrl:
    env.NODE_ENV === "development"
      ? env.INNGEST_DEV_SERVER_URL
      : env.INNGEST_BASE_URL,
});

export const sendMedicalEvent = async <
  T extends keyof MedicalReservationEvents,
>(
  eventName: T,
  data: MedicalReservationEvents[T]["data"],
) => {
  return await inngest.send({
    name: eventName,
    data,
  });
};
