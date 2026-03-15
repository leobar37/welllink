/**
 * Database mock for testing - simulates Drizzle database operations
 */

export class MockDatabase {
  private data: Map<string, Map<string, any>> = new Map();

  constructor() {
    // Initialize tables
    this.data.set("product", new Map());
    this.data.set("inventory_item", new Map());
    this.data.set("stock_movement", new Map());
    this.data.set("supplier", new Map());
    this.data.set("product_category", new Map());
    this.data.set("supplier_product", new Map());
    this.data.set("purchase_order", new Map());
    this.data.set("purchase_order_item", new Map());
    this.data.set("automation", new Map());
    this.data.set("automation_trigger", new Map());
    this.data.set("automation_action", new Map());
    this.data.set("automation_execution_log", new Map());
    this.data.set("automation_template", new Map());
    this.data.set("profile", new Map());
    this.data.set("staff", new Map());
    this.data.set("staff_availability", new Map());
    this.data.set("staff_service", new Map());
    this.data.set("service", new Map());
    this.data.set("service_product", new Map());
    this.data.set("client", new Map());
    this.data.set("client_package", new Map());
    this.data.set("membership", new Map());
    this.data.set("service_package", new Map());
    this.data.set("reservation", new Map());
    this.data.set("reservation_request", new Map());
  }

  getTable(tableName: string): Map<string, any> {
    if (!this.data.has(tableName)) {
      this.data.set(tableName, new Map());
    }
    return this.data.get(tableName)!;
  }

  clear(): void {
    for (const table of this.data.values()) {
      table.clear();
    }
  }

  // Helper to generate UUIDs
  generateId(prefix: string = "id"): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance for tests
let dbInstance: MockDatabase | null = null;

export function getMockDatabase(): MockDatabase {
  if (!dbInstance) {
    dbInstance = new MockDatabase();
  }
  return dbInstance;
}

export function resetMockDatabase(): void {
  if (dbInstance) {
    dbInstance.clear();
  } else {
    dbInstance = new MockDatabase();
  }
}
