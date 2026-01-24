import { Memory } from "@voltagent/core";
import { LibSQLMemoryAdapter } from "@voltagent/libsql";
import path from "node:path";

/**
 * Create VoltAgent Memory adapter with LibSQL for persistent conversation storage
 */
export function createChatMemory(): Memory {
  // Use a path relative to the project root for persistence
  const dbPath = path.resolve(process.cwd(), ".voltagent/chat.db");

  const adapter = new LibSQLMemoryAdapter({
    url: `file:${dbPath}`,
  });

  return new Memory({
    storage: adapter,
  });
}

/**
 * Create Workflow Memory for complex multi-step flows
 */
export function createWorkflowMemory(): Memory {
  const dbPath = path.resolve(process.cwd(), ".voltagent/workflows.db");

  const adapter = new LibSQLMemoryAdapter({
    url: `file:${dbPath}`,
  });

  return new Memory({
    storage: adapter,
  });
}
