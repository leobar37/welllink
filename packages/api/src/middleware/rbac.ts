import { Elysia } from "elysia";
import { ForbiddenException, UnauthorizedException } from "../utils/http-exceptions";
import { authPlugin } from "../plugins/auth";
import type { RequestContext } from "../types/context";
import type { StaffRole } from "../db/schema/enums";
import { StaffRepository } from "../services/repository/staff";
import { ProfileRepository } from "../services/repository/profile";

/**
 * Permission types
 */
export type Permission =
  | "staff:create"
  | "staff:read"
  | "staff:update"
  | "staff:delete"
  | "service:assign"
  | "availability:manage"
  | "appointment:create"
  | "appointment:read"
  | "appointment:update"
  | "appointment:delete"
  | "inventory:read"
  | "inventory:write"
  | "automation:create"
  | "automation:read"
  | "automation:update"
  | "automation:delete"
  | "client:create"
  | "client:read"
  | "client:update"
  | "client:delete";

/**
 * Role-based permissions mapping
 */
const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  admin: [
    "staff:create",
    "staff:read",
    "staff:update",
    "staff:delete",
    "service:assign",
    "availability:manage",
    "appointment:create",
    "appointment:read",
    "appointment:update",
    "appointment:delete",
    "inventory:read",
    "inventory:write",
    "automation:create",
    "automation:read",
    "automation:update",
    "automation:delete",
    "client:create",
    "client:read",
    "client:update",
    "client:delete",
  ],
  manager: [
    "staff:read",
    "staff:update",
    "service:assign",
    "availability:manage",
    "appointment:create",
    "appointment:read",
    "appointment:update",
    "appointment:delete",
    "inventory:read",
    "inventory:write",
    "automation:create",
    "automation:read",
    "automation:update",
    "client:create",
    "client:read",
    "client:update",
  ],
  staff: [
    "appointment:read",
    "client:read",
  ],
};

/**
 * Get permissions for a role
 */
export function getPermissionsForRole(role: StaffRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: StaffRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * RBAC result type
 */
export interface RbacResult {
  staffRole: StaffRole | null;
  isOwner: boolean;
  staffId?: string | null;
  hasPermission: (permission: Permission) => boolean;
  getPermissions: () => Permission[];
}

/**
 * RBAC Plugin for Elysia
 * Provides role-based access control for staff management
 */
export const rbacPlugin = new Elysia({ name: "rbac" })
  .use(authPlugin)
  .derive({ as: "scoped" }, async ({ ctx }) => {
    if (!ctx) {
      throw new UnauthorizedException("No authentication context found");
    }
    if (!ctx.userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    // Get user's profile(s)
    const profileRepo = new ProfileRepository();
    const profiles = await profileRepo.findByUser(ctx, ctx.userId);

    // Get staff role if staff member
    let staffRole: StaffRole | null = null;
    let isOwner = false;

    if (profiles.length > 0) {
      // Check if user is the profile owner
      // For now, we'll consider the first profile owner as admin
      // In the future, we might want to check against Better Auth user directly
      isOwner = true;

      // For profile owners, give them admin role
      staffRole = "admin";
    }

    const rbac: RbacResult = {
      staffRole,
      isOwner,
      hasPermission: (permission: Permission) => {
        if (!staffRole) return false;
        return getPermissionsForRole(staffRole).includes(permission);
      },
      getPermissions: () => {
        if (!staffRole) return [];
        return getPermissionsForRole(staffRole);
      },
    };

    return { rbac };
  });

/**
 * Create a permission guard middleware
 */
export function requirePermission(permission: Permission) {
  return new Elysia({ name: `permission:${permission}` })
    .use(rbacPlugin)
    .derive({ as: "scoped" }, ({ rbac }) => {
      if (!rbac || !rbac.hasPermission(permission)) {
        throw new ForbiddenException(
          `No tienes permiso para realizar esta acción. Se requiere: ${permission}`
        );
      }
      return { rbac };
    });
}

/**
 * Create a role guard middleware
 */
export function requireRole(...roles: StaffRole[]) {
  return new Elysia({ name: `role:${roles.join(",")}` })
    .use(rbacPlugin)
    .derive({ as: "scoped" }, ({ rbac }) => {
      if (!rbac || !rbac.staffRole || !roles.includes(rbac.staffRole)) {
        throw new ForbiddenException(
          `No tienes el rol requerido. Roles permitidos: ${roles.join(", ")}`
        );
      }
      return { rbac };
    });
}

/**
 * Staff-specific RBAC that checks staff member role within a profile
 */
export const staffRbacPlugin = new Elysia({ name: "staff-rbac" })
  .use(authPlugin)
  .derive({ as: "scoped" }, async ({ ctx, params, query }) => {
    if (!ctx) {
      throw new UnauthorizedException("No authentication context found");
    }
    if (!ctx.userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    const profileId = (query?.profileId as string | undefined) || (params?.profileId as string | undefined);

    // Get staff member if profile is specified
    let staffRole: StaffRole | null = null;
    let isOwner = false;
    let staffId: string | null = null;

    if (profileId) {
      const profileRepo = new ProfileRepository();
      const staffRepo = new StaffRepository();

      // Check if user owns the profile
      const userProfiles = await profileRepo.findByUser(ctx, ctx.userId);
      const isProfileOwner = userProfiles.some((p) => p.id === profileId);

      if (isProfileOwner) {
        isOwner = true;
        staffRole = "admin";
      } else {
        // Check if user is a staff member of this profile
        const staffMember = await staffRepo.findByUser(ctx);
        const profileStaff = staffMember.filter((s) => s.profileId === profileId);

        if (profileStaff.length > 0) {
          staffId = profileStaff[0].id;
          staffRole = profileStaff[0].role;
        }
      }
    } else {
      // No profile specified - check if user owns any profile
      const profileRepo = new ProfileRepository();
      const userProfiles = await profileRepo.findByUser(ctx, ctx.userId);

      if (userProfiles.length > 0) {
        isOwner = true;
        staffRole = "admin";
      }
    }

    const rbac: RbacResult = {
      staffRole,
      isOwner,
      staffId,
      hasPermission: (permission: Permission) => {
        if (!staffRole) return false;
        if (isOwner) return true; // Owners have all permissions
        return getPermissionsForRole(staffRole).includes(permission);
      },
      getPermissions: () => {
        if (!staffRole) return [];
        if (isOwner) {
          // Owners (admins) have all permissions
          return Object.values(ROLE_PERMISSIONS).flat();
        }
        return getPermissionsForRole(staffRole);
      },
    };

    return { rbac };
  });
