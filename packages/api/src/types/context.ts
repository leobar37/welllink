export interface RequestContext {
  userId: string;
  email: string;
  role: string;
  // Note: No tenantId for single-tenant app
}
