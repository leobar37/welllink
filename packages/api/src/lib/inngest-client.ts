import { Inngest } from "inngest";
import type { MedicalReservationEvents } from "../types/inngest-events";

export const inngest = new Inngest({
  id: process.env.INNGEST_APP_ID || "medical-chatbot-platform",
  name: "Medical Chatbot Platform",
  eventKey: process.env.INNGEST_EVENT_KEY || "",
  baseUrl:
    process.env.NODE_ENV === "development"
      ? process.env.INNGEST_DEV_SERVER_URL || "http://localhost:8288"
      : process.env.INNGEST_BASE_URL || "https://api.inngest.com",
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
