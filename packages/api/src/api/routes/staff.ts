import { Elysia, t } from "elysia";
import { servicesPlugin } from "../../plugins/services";
import { staffRbacPlugin, requirePermission } from "../../middleware/rbac";
import { errorMiddleware } from "../../middleware/error";
import { StaffService } from "../../services/business/staff";
import { StaffRepository } from "../../services/repository/staff";
import { StaffServiceRepository } from "../../services/repository/staff-service";
import { StaffAvailabilityRepository } from "../../services/repository/staff-availability";
import { ProfileRepository } from "../../services/repository/profile";

export const staffRoutes = new Elysia({ prefix: "/staff" })
  .use(errorMiddleware)
  .use(servicesPlugin)
  .use(staffRbacPlugin)
  .derive({ as: "global" }, () => {
    const staffRepository = new StaffRepository();
    const staffServiceRepo = new StaffServiceRepository();
    const staffAvailabilityRepo = new StaffAvailabilityRepository();
    const profileRepository = new ProfileRepository();

    const staffService = new StaffService(
      staffRepository,
      staffServiceRepo,
      staffAvailabilityRepo,
      profileRepository
    );

    return {
      staffService,
    };
  })

  // ========================================
  // STAFF CRUD
  // ========================================

  // Get all staff members
  .get(
    "/",
    async ({ query, staffService, rbac }) => {
      // Require read permission
      if (!rbac.hasPermission("staff:read")) {
        throw new Error("No tienes permiso para ver el personal");
      }

      return staffService.getActiveStaffByProfile(
        { userId: "" } as any, // Will be set by auth context
        query.profileId as string | undefined
      );
    },
    {
      query: t.Object({
        profileId: t.Optional(t.String()),
      }),
    }
  )

  // Get staff with all relations
  .get(
    "/with-relations",
    async ({ query, staffService, rbac }) => {
      // Require read permission
      if (!rbac.hasPermission("staff:read")) {
        throw new Error("No tienes permiso para ver el personal");
      }

      const staff = await staffService.getActiveStaffByProfile(
        { userId: "" } as any,
        query.profileId as string | undefined
      );

      // Add services and availability to each staff member
      const staffWithRelations = await Promise.all(
        staff.map(async (s) => {
          const services = await staffService.getStaffServices(
            { userId: "" } as any,
            s.id,
            query.profileId as string | undefined
          );
          const availabilities = await staffService.getAvailability(
            { userId: "" } as any,
            s.id,
            query.profileId as string | undefined
          );
          return {
            ...s,
            services,
            availabilities,
          };
        })
      );

      return staffWithRelations;
    },
    {
      query: t.Object({
        profileId: t.Optional(t.String()),
      }),
    }
  )

  // Get single staff member
  .get(
    "/:id",
    async ({ params, query, staffService, rbac }) => {
      // Require read permission
      if (!rbac.hasPermission("staff:read")) {
        throw new Error("No tienes permiso para ver este miembro del personal");
      }

      const staff = await staffService.getStaffWithRelations(
        { userId: "" } as any,
        params.id,
        query.profileId as string | undefined
      );

      if (!staff) {
        throw new Error("Miembro del personal no encontrado");
      }

      return staff;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        profileId: t.Optional(t.String()),
      }),
    }
  )

  // Create staff member
  .post(
    "/",
    async ({ body, set, staffService, rbac }) => {
      // Require create permission
      if (!rbac.hasPermission("staff:create")) {
        throw new Error("No tienes permiso para crear personal");
      }

      const staff = await staffService.createStaff(
        { userId: "" } as any,
        body.profileId as string | undefined,
        {
          name: body.name,
          email: body.email,
          phone: body.phone,
          role: body.role,
          avatarId: body.avatarId,
          metadata: body.metadata,
        }
      );

      set.status = 201;
      return staff;
    },
    {
      body: t.Object({
        profileId: t.Optional(t.String()),
        name: t.String({ minLength: 1 }),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        role: t.Optional(t.Union([
          t.Literal("admin"),
          t.Literal("manager"),
          t.Literal("staff"),
        ])),
        avatarId: t.Optional(t.String()),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
    }
  )

  // Update staff member
  .put(
    "/:id",
    async ({ params, body, staffService, rbac }) => {
      // Require update permission
      if (!rbac.hasPermission("staff:update")) {
        throw new Error("No tienes permiso para actualizar personal");
      }

      return staffService.updateStaff(
        { userId: "" } as any,
        params.id,
        (body as any).profileId as string | undefined,
        {
          name: body.name,
          email: body.email,
          phone: body.phone,
          role: body.role,
          avatarId: body.avatarId,
          isActive: body.isActive,
          metadata: body.metadata,
        }
      );
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        profileId: t.Optional(t.String()),
        name: t.Optional(t.String({ minLength: 1 })),
        email: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        role: t.Optional(t.Union([
          t.Literal("admin"),
          t.Literal("manager"),
          t.Literal("staff"),
        ])),
        avatarId: t.Optional(t.String()),
        isActive: t.Optional(t.Boolean()),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
    }
  )

  // Delete (soft delete) staff member
  .delete(
    "/:id",
    async ({ params, query, set, staffService, rbac }) => {
      // Require delete permission
      if (!rbac.hasPermission("staff:delete")) {
        throw new Error("No tienes permiso para eliminar personal");
      }

      await staffService.deleteStaff(
        { userId: "" } as any,
        params.id,
        query.profileId as string | undefined
      );

      set.status = 204;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      query: t.Object({
        profileId: t.Optional(t.String()),
      }),
    }
  )

  // ========================================
  // SERVICE ASSIGNMENTS
  // ========================================

  // Get services assigned to a staff member
  .get(
    "/:staffId/services",
    async ({ params, query, staffService, rbac }) => {
      // Require read permission
      if (!rbac.hasPermission("staff:read")) {
        throw new Error("No tienes permiso para ver servicios");
      }

      return staffService.getStaffServices(
        { userId: "" } as any,
        params.staffId,
        query.profileId as string | undefined
      );
    },
    {
      params: t.Object({
        staffId: t.String(),
      }),
      query: t.Object({
        profileId: t.Optional(t.String()),
      }),
    }
  )

  // Assign a service to a staff member
  .post(
    "/:staffId/services",
    async ({ params, body, set, staffService, rbac }) => {
      // Require service assign permission
      if (!rbac.hasPermission("service:assign")) {
        throw new Error("No tienes permiso para asignar servicios");
      }

      await staffService.assignService(
        { userId: "" } as any,
        params.staffId,
        body.serviceId,
        body.profileId as string | undefined
      );

      set.status = 201;
      return { success: true };
    },
    {
      params: t.Object({
        staffId: t.String(),
      }),
      body: t.Object({
        profileId: t.Optional(t.String()),
        serviceId: t.String({ minLength: 1 }),
      }),
    }
  )

  // Remove a service from a staff member
  .delete(
    "/:staffId/services/:serviceId",
    async ({ params, query, set, staffService, rbac }) => {
      // Require service assign permission
      if (!rbac.hasPermission("service:assign")) {
        throw new Error("No tienes permiso para eliminar asignaciones de servicios");
      }

      await staffService.removeService(
        { userId: "" } as any,
        params.staffId,
        params.serviceId,
        query.profileId as string | undefined
      );

      set.status = 204;
    },
    {
      params: t.Object({
        staffId: t.String(),
        serviceId: t.String(),
      }),
      query: t.Object({
        profileId: t.Optional(t.String()),
      }),
    }
  )

  // Replace all services for a staff member
  .put(
    "/:staffId/services",
    async ({ params, body, set, staffService, rbac }) => {
      // Require service assign permission
      if (!rbac.hasPermission("service:assign")) {
        throw new Error("No tienes permiso para asignar servicios");
      }

      await staffService.replaceStaffServices(
        { userId: "" } as any,
        params.staffId,
        body.serviceIds,
        body.profileId as string | undefined
      );

      set.status = 200;
      return { success: true };
    },
    {
      params: t.Object({
        staffId: t.String(),
      }),
      body: t.Object({
        profileId: t.Optional(t.String()),
        serviceIds: t.Array(t.String({ minLength: 1 })),
      }),
    }
  )

  // ========================================
  // AVAILABILITY
  // ========================================

  // Get availability for a staff member
  .get(
    "/:staffId/availability",
    async ({ params, query, staffService, rbac }) => {
      // Require read permission
      if (!rbac.hasPermission("staff:read")) {
        throw new Error("No tienes permiso para ver disponibilidad");
      }

      return staffService.getAvailability(
        { userId: "" } as any,
        params.staffId,
        query.profileId as string | undefined
      );
    },
    {
      params: t.Object({
        staffId: t.String(),
      }),
      query: t.Object({
        profileId: t.Optional(t.String()),
      }),
    }
  )

  // Set availability for a staff member (single day)
  .post(
    "/:staffId/availability",
    async ({ params, body, set, staffService, rbac }) => {
      // Require availability manage permission
      if (!rbac.hasPermission("availability:manage")) {
        throw new Error("No tienes permiso para gestionar disponibilidad");
      }

      await staffService.setAvailability(
        { userId: "" } as any,
        params.staffId,
        {
          dayOfWeek: body.dayOfWeek,
          startTime: body.startTime,
          endTime: body.endTime,
          breaks: body.breaks,
          isAvailable: body.isAvailable,
        },
        body.profileId as string | undefined
      );

      set.status = 201;
      return { success: true };
    },
    {
      params: t.Object({
        staffId: t.String(),
      }),
      body: t.Object({
        profileId: t.Optional(t.String()),
        dayOfWeek: t.Number({ minimum: 1, maximum: 7 }),
        startTime: t.String({ minLength: 5, maxLength: 5 }),
        endTime: t.String({ minLength: 5, maxLength: 5 }),
        breaks: t.Optional(t.Array(t.Object({
          start: t.String({ minLength: 5, maxLength: 5 }),
          end: t.String({ minLength: 5, maxLength: 5 }),
        }))),
        isAvailable: t.Optional(t.Boolean()),
      }),
    }
  )

  // Set multiple availabilities for a staff member
  .put(
    "/:staffId/availability",
    async ({ params, body, set, staffService, rbac }) => {
      // Require availability manage permission
      if (!rbac.hasPermission("availability:manage")) {
        throw new Error("No tienes permiso para gestionar disponibilidad");
      }

      await staffService.setAvailabilities(
        { userId: "" } as any,
        params.staffId,
        body.availabilities,
        body.profileId as string | undefined
      );

      set.status = 200;
      return { success: true };
    },
    {
      params: t.Object({
        staffId: t.String(),
      }),
      body: t.Object({
        profileId: t.Optional(t.String()),
        availabilities: t.Array(t.Object({
          dayOfWeek: t.Number({ minimum: 1, maximum: 7 }),
          startTime: t.String({ minLength: 5, maxLength: 5 }),
          endTime: t.String({ minLength: 5, maxLength: 5 }),
          breaks: t.Optional(t.Array(t.Object({
            start: t.String({ minLength: 5, maxLength: 5 }),
            end: t.String({ minLength: 5, maxLength: 5 }),
          }))),
          isAvailable: t.Optional(t.Boolean()),
        })),
      }),
    }
  )

  // Delete availability for a staff member
  .delete(
    "/:staffId/availability/:availabilityId",
    async ({ params, query, set, staffService, rbac }) => {
      // Require availability manage permission
      if (!rbac.hasPermission("availability:manage")) {
        throw new Error("No tienes permiso para gestionar disponibilidad");
      }

      await staffService.deleteAvailability(
        { userId: "" } as any,
        params.staffId,
        params.availabilityId,
        query.profileId as string | undefined
      );

      set.status = 204;
    },
    {
      params: t.Object({
        staffId: t.String(),
        availabilityId: t.String(),
      }),
      query: t.Object({
        profileId: t.Optional(t.String()),
      }),
    }
  );
