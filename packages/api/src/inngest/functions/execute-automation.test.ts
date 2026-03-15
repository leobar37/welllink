import { describe, it, expect, beforeEach, mock } from "bun:test";
import { 
  evaluateEventTrigger, 
  resolveVariable, 
  resolveMessage,
  executeWhatsAppAction,
  executeEmailAction,
  executeUpdateRecordAction,
  executeCreateTaskAction
} from "./execute-automation";
import type { EventTriggerConfig } from "../../db/schema/automation-trigger";
import type { WhatsAppActionConfig, EmailActionConfig, UpdateRecordActionConfig, CreateTaskActionConfig } from "../../db/schema/automation-action";

describe("Automation Trigger Evaluation", () => {
  describe("evaluateEventTrigger", () => {
    it("should return shouldTrigger=false when event type doesn't match", () => {
      const triggerConfig: EventTriggerConfig = {
        eventType: "appointment.completed",
      };
      
      const eventData = {
        type: "appointment.created",
        reservationId: "123",
      };

      const result = evaluateEventTrigger(triggerConfig, eventData);
      expect(result.shouldTrigger).toBe(false);
    });

    it("should return shouldTrigger=true when event type matches", () => {
      const triggerConfig: EventTriggerConfig = {
        eventType: "appointment.completed",
      };
      
      const eventData = {
        type: "appointment.completed",
        reservationId: "123",
      };

      const result = evaluateEventTrigger(triggerConfig, eventData);
      expect(result.shouldTrigger).toBe(true);
    });

    it("should filter by exact match filter", () => {
      const triggerConfig: EventTriggerConfig = {
        eventType: "appointment.completed",
        filters: {
          status: "confirmed",
        },
      };
      
      const eventData = {
        type: "appointment.completed",
        status: "confirmed",
        reservationId: "123",
      };

      const result = evaluateEventTrigger(triggerConfig, eventData);
      expect(result.shouldTrigger).toBe(true);
    });

    it("should not trigger when filter doesn't match", () => {
      const triggerConfig: EventTriggerConfig = {
        eventType: "appointment.completed",
        filters: {
          status: "confirmed",
        },
      };
      
      const eventData = {
        type: "appointment.completed",
        status: "cancelled",
        reservationId: "123",
      };

      const result = evaluateEventTrigger(triggerConfig, eventData);
      expect(result.shouldTrigger).toBe(false);
    });

    it("should filter by array of acceptable values", () => {
      const triggerConfig: EventTriggerConfig = {
        eventType: "appointment.completed",
        filters: {
          status: ["confirmed", "pending"],
        },
      };
      
      const eventData = {
        type: "appointment.completed",
        status: "pending",
        reservationId: "123",
      };

      const result = evaluateEventTrigger(triggerConfig, eventData);
      expect(result.shouldTrigger).toBe(true);
    });

    it("should support nested field filtering", () => {
      const triggerConfig: EventTriggerConfig = {
        eventType: "appointment.completed",
        filters: {
          "customer.status": "vip",
        },
      };
      
      const eventData = {
        type: "appointment.completed",
        customer: {
          status: "vip",
          name: "John",
        },
        reservationId: "123",
      };

      const result = evaluateEventTrigger(triggerConfig, eventData);
      expect(result.shouldTrigger).toBe(true);
    });
  });

  describe("resolveVariable", () => {
    it("should resolve simple variable path", () => {
      const data = {
        name: "John",
        age: 30,
      };

      expect(resolveVariable(data, "name")).toBe("John");
      expect(resolveVariable(data, "age")).toBe(30);
    });

    it("should resolve nested variable path", () => {
      const data = {
        customer: {
          name: "John",
          address: {
            city: "NYC",
          },
        },
      };

      expect(resolveVariable(data, "customer.name")).toBe("John");
      expect(resolveVariable(data, "customer.address.city")).toBe("NYC");
    });

    it("should return undefined for non-existent path", () => {
      const data = {
        name: "John",
      };

      expect(resolveVariable(data, "age")).toBe(undefined);
      expect(resolveVariable(data, "customer.name")).toBe(undefined);
    });

    it("should return undefined for null/undefined values", () => {
      const data = {
        name: null,
        age: undefined,
      };

      expect(resolveVariable(data, "name")).toBe(null);
      expect(resolveVariable(data, "age")).toBe(undefined);
    });
  });

  describe("resolveMessage", () => {
    it("should replace variables in message", () => {
      const template = "Hello {{name}}, your appointment is at {{time}}";
      const data = {
        name: "John",
        time: "10:00",
      };

      const result = resolveMessage(template, data);
      expect(result).toBe("Hello John, your appointment is at 10:00");
    });

    it("should keep unreplaced variables", () => {
      const template = "Hello {{name}}, your appointment is at {{time}}";
      const data = {
        name: "John",
      };

      const result = resolveMessage(template, data);
      expect(result).toBe("Hello John, your appointment is at {{time}}");
    });

    it("should support nested variables", () => {
      const template = "Hello {{customer.name}}";
      const data = {
        customer: {
          name: "John",
        },
      };

      const result = resolveMessage(template, data);
      expect(result).toBe("Hello John");
    });
  });
});

describe("Action Execution", () => {
  describe("executeUpdateRecordAction", () => {
    it("should resolve fixed entity ID", async () => {
      const config: UpdateRecordActionConfig = {
        entityType: "appointment",
        entityIdType: "fixed",
        entityId: "123-456",
        updates: {
          status: "completed",
        },
      };

      const triggerData = {};

      const result = await executeUpdateRecordAction(config, triggerData);
      expect(result.success).toBe(true);
      expect(result.result?.entityId).toBe("123-456");
    });

    it("should resolve variable entity ID", async () => {
      const config: UpdateRecordActionConfig = {
        entityType: "appointment",
        entityIdType: "variable",
        entityIdVariablePath: "reservationId",
        updates: {
          status: "completed",
        },
      };

      const triggerData = {
        reservationId: "abc-123",
      };

      const result = await executeUpdateRecordAction(config, triggerData);
      expect(result.success).toBe(true);
      expect(result.result?.entityId).toBe("abc-123");
    });

    it("should resolve variable update values", async () => {
      const config: UpdateRecordActionConfig = {
        entityType: "appointment",
        entityIdType: "fixed",
        entityId: "123-456",
        updates: {
          status: "$newStatus",
          notes: "Updated by automation",
        },
      };

      const triggerData = {
        newStatus: "cancelled",
      };

      const result = await executeUpdateRecordAction(config, triggerData);
      expect(result.success).toBe(true);
      expect((result.result?.updates as any)?.status).toBe("cancelled");
      expect((result.result?.updates as any)?.notes).toBe("Updated by automation");
    });

    it("should return error when no entity ID found", async () => {
      const config: UpdateRecordActionConfig = {
        entityType: "appointment",
        entityIdType: "variable",
        entityIdVariablePath: "reservationId",
        updates: {
          status: "completed",
        },
      };

      const triggerData = {};

      const result = await executeUpdateRecordAction(config, triggerData);
      expect(result.success).toBe(false);
      expect(result.error).toBe("No entity ID found");
    });
  });

  describe("executeCreateTaskAction", () => {
    it("should resolve task title with variables", async () => {
      const config: CreateTaskActionConfig = {
        title: "Follow up with {{customer.name}}",
        assignToType: "staff",
        staffId: "staff-123",
        dueDateType: "relative",
        relativeDueDate: "+1d",
        priority: "high",
      };

      const triggerData = {
        customer: {
          name: "John",
        },
      };

      const result = await executeCreateTaskAction(config, triggerData, "profile-123");
      expect(result.success).toBe(true);
      expect(result.result?.title).toBe("Follow up with John");
      expect(result.result?.priority).toBe("high");
    });

    it("should calculate relative due date correctly", async () => {
      const config: CreateTaskActionConfig = {
        title: "Test task",
        assignToType: "staff",
        staffId: "staff-123",
        dueDateType: "relative",
        relativeDueDate: "+2d",
        priority: "normal",
      };

      const triggerData = {};

      const result = await executeCreateTaskAction(config, triggerData, "profile-123");
      expect(result.success).toBe(true);
      
      const dueDate = new Date(result.result?.dueDate as string);
      const today = new Date();
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Should be 1 or 2 days from now
      expect(diffDays).toBeGreaterThanOrEqual(1);
      expect(diffDays).toBeLessThanOrEqual(3);
    });

    it("should resolve absolute due date", async () => {
      const absoluteDate = "2025-12-31T23:59:59Z";
      
      const config: CreateTaskActionConfig = {
        title: "Test task",
        assignToType: "staff",
        staffId: "staff-123",
        dueDateType: "absolute",
        absoluteDueDate: absoluteDate,
        priority: "normal",
      };

      const triggerData = {};

      const result = await executeCreateTaskAction(config, triggerData, "profile-123");
      expect(result.success).toBe(true);
      // Date is converted to ISO string, which may have different formatting
      expect(result.result?.dueDate).toContain("2025-12-31");
    });
  });
});
