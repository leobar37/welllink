---
name: fullstack-inngest
description: Background job development with Inngest. Handles event-driven functions, scheduled jobs, and automation execution engine.
---

# Full-Stack Inngest Worker

Background job development for CitaBot using Inngest.

## When to Use This Skill

Use for:
- Event-driven background functions
- Scheduled/cron jobs
- Automation execution engine
- WhatsApp message sending
- Stock alert notifications

## Work Procedure

### 1. Understand Existing Inngest Setup

```bash
# Read existing functions
cat packages/api/src/inngest/functions/*.ts
cat packages/api/src/inngest/types.ts
```

### 2. Create Inngest Function

Create in `packages/api/src/inngest/functions/`:

```typescript
import { inngest } from "../client";

export const lowStockAlert = inngest.createFunction(
  { id: "low-stock-alert" },
  { cron: "0 9 * * *" }, // Daily at 9 AM
  async ({ event, step }) => {
    const lowStockItems = await step.run("get-low-stock", async () => {
      return inventoryService.getLowStockItems();
    });
    
    if (lowStockItems.length > 0) {
      await step.run("send-alerts", async () => {
        return notificationService.sendLowStockAlert(lowStockItems);
      });
    }
    
    return { alerted: lowStockItems.length };
  }
);
```

### 3. Register Function

Add to `packages/api/src/inngest/index.ts`:

```typescript
import { lowStockAlert } from "./functions/low-stock-alert";

export const functions = [
  // ... existing functions
  lowStockAlert,
];
```

### 4. Define Event Types

Add to `packages/api/src/inngest/types.ts`:

```typescript
export type Events = {
  "inventory/low-stock": {
    data: {
      productId: string;
      currentStock: number;
      minStock: number;
    };
  };
  "automation/execute": {
    data: {
      automationId: string;
      triggerData: Record<string, unknown>;
    };
  };
};
```

### 5. Send Events

From API routes or services:

```typescript
await inngest.send({
  name: "inventory/low-stock",
  data: { productId, currentStock, minStock },
});
```

### 6. Testing

```typescript
import { describe, it, expect } from "bun:test";
import { lowStockAlert } from "./low-stock-alert";

describe("lowStockAlert", () => {
  it("should send alert for low stock items", async () => {
    // Mock inventory service
    // Run function
    // Verify notification sent
  });
});
```

### 7. Local Development

```bash
# Terminal 1: Start Inngest dev server
cd packages/api
bun run inngest:dev

# Terminal 2: Start API (Inngest will auto-discover)
bun run dev
```

### 8. Validation

```bash
cd packages/api
bun run typecheck
bun run test
```

## Example Handoff

```json
{
  "salientSummary": "Created lowStockAlert Inngest function that runs daily at 9 AM, checks for products below minimum stock, and sends WhatsApp notifications. Also created automation execution engine that evaluates triggers and executes actions.",
  "whatWasImplemented": "Inngest function low-stock-alert with cron trigger (0 9 * * *). Function queries inventory for low stock items and sends notifications via Evolution API. Automation execution engine with event trigger support for appointment.completed, appointment.cancelled, and custom events. Execution logging to automation_execution_log table.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "bun run typecheck", "exitCode": 0, "observation": "No type errors" },
      { "command": "bun test src/inngest/functions/low-stock-alert.test.ts", "exitCode": 0, "observation": "3 tests passing" },
      { "command": "bun test src/inngest/functions/execute-automation.test.ts", "exitCode": 0, "observation": "5 tests passing" }
    ],
    "interactiveChecks": [
      { "action": "Triggered test event via Inngest dashboard", "observed": "Function executed successfully, notification sent" }
    ]
  },
  "tests": {
    "added": [
      { "file": "src/inngest/functions/low-stock-alert.test.ts", "cases": [
        { "name": "should send alert when low stock items exist", "verifies": "Alert logic" },
        { "name": "should not send alert when no low stock items", "verifies": "Empty handling" }
      ]},
      { "file": "src/inngest/functions/execute-automation.test.ts", "cases": [
        { "name": "should execute WhatsApp action", "verifies": "Action execution" },
        { "name": "should evaluate condition before executing", "verifies": "Condition logic" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- Inngest client configuration issues
- Event type conflicts with existing events
- Evolution API integration problems
- Cron schedule conflicts
- Step function complexity requiring architectural review
