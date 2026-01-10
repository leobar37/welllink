# Slot State Management System

## 🎯 Overview

Comprehensive management of time slot states for the medical reservation system, implementing a robust state machine for appointment booking workflows.

## 🔄 Slot Status States

### Available States:

```typescript
type SlotStatus =
  | "available" // Open for booking
  | "pending_approval" // Requested, waiting doctor approval
  | "reserved" // Confirmed appointment
  | "expired" // Request expired without approval
  | "blocked"; // Doctor blocked this slot
```

## 📊 State Transition Diagram

```
available
  ↓ request
pending_approval (15-30 min timeout)
  ↓ approve       ↓ reject       ↓ timeout
reserved         available      expired
  ↓ cancel       ↓ complete
available        reserved
```

## 🏗️ Implementation

### State Transition Logic

```typescript
// packages/api/src/services/business/slot-state-service.ts
export class SlotStateService {
  constructor(
    private timeSlotRepository: TimeSlotRepository,
    private reservationRequestRepository: ReservationRequestRepository,
    private inngestEventService: InngestEventService,
  ) {}

  /**
   * Request a slot (available → pending_approval)
   */
  async requestSlot(slotId: string, requestId: string): Promise<TimeSlot> {
    const slot = await this.timeSlotRepository.findById(slotId);

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.status !== "available") {
      throw new Error(`Slot is ${slot.status}, cannot request`);
    }

    if (slot.currentReservations >= slot.maxReservations) {
      throw new Error("Slot is fully booked");
    }

    // Update slot status
    const updatedSlot = await this.timeSlotRepository.updateStatus(
      slotId,
      "pending_approval",
    );

    // Schedule expiration workflow
    await this.scheduleExpiration(slotId, requestId);

    // Log state change
    await this.logStateChange(
      slotId,
      "available",
      "pending_approval",
      requestId,
    );

    return updatedSlot;
  }

  /**
   * Approve a slot (pending_approval → reserved)
   */
  async approveSlot(slotId: string, requestId: string): Promise<TimeSlot> {
    const slot = await this.timeSlotRepository.findById(slotId);

    if (!slot || slot.status !== "pending_approval") {
      throw new Error("Slot is not in pending approval state");
    }

    // Update slot status and increment reservations
    const updatedSlot = await this.timeSlotRepository.updateStatus(
      slotId,
      "reserved",
    );
    await this.timeSlotRepository.incrementReservations(slotId);

    // Cancel expiration workflow
    await this.cancelExpiration(slotId);

    // Log state change
    await this.logStateChange(
      slotId,
      "pending_approval",
      "reserved",
      requestId,
    );

    return updatedSlot;
  }

  /**
   * Reject a slot (pending_approval → available)
   */
  async rejectSlot(slotId: string, requestId: string): Promise<TimeSlot> {
    const slot = await this.timeSlotRepository.findById(slotId);

    if (!slot || slot.status !== "pending_approval") {
      throw new Error("Slot is not in pending approval state");
    }

    // Update slot status
    const updatedSlot = await this.timeSlotRepository.updateStatus(
      slotId,
      "available",
    );

    // Cancel expiration workflow
    await this.cancelExpiration(slotId);

    // Log state change
    await this.logStateChange(
      slotId,
      "pending_approval",
      "available",
      requestId,
    );

    return updatedSlot;
  }

  /**
   * Cancel a reservation (reserved → available)
   */
  async cancelReservation(
    slotId: string,
    reservationId: string,
  ): Promise<TimeSlot> {
    const slot = await this.timeSlotRepository.findById(slotId);

    if (!slot || slot.status !== "reserved") {
      throw new Error("Slot is not reserved");
    }

    // Update slot status and decrement reservations
    const updatedSlot = await this.timeSlotRepository.updateStatus(
      slotId,
      "available",
    );
    await this.timeSlotRepository.decrementReservations(slotId);

    // Log state change
    await this.logStateChange(slotId, "reserved", "available", reservationId);

    return updatedSlot;
  }

  /**
   * Block a slot (available → blocked)
   */
  async blockSlot(slotId: string, reason: string): Promise<TimeSlot> {
    const slot = await this.timeSlotRepository.findById(slotId);

    if (!slot) {
      throw new Error("Slot not found");
    }

    if (slot.status !== "available") {
      throw new Error("Only available slots can be blocked");
    }

    const updatedSlot = await this.timeSlotRepository.updateStatus(
      slotId,
      "blocked",
    );

    // Log state change with reason
    await this.logStateChange(
      slotId,
      "available",
      "blocked",
      undefined,
      reason,
    );

    return updatedSlot;
  }

  /**
   * Unblock a slot (blocked → available)
   */
  async unblockSlot(slotId: string): Promise<TimeSlot> {
    const slot = await this.timeSlotRepository.findById(slotId);

    if (!slot || slot.status !== "blocked") {
      throw new Error("Slot is not blocked");
    }

    const updatedSlot = await this.timeSlotRepository.updateStatus(
      slotId,
      "available",
    );

    // Log state change
    await this.logStateChange(slotId, "blocked", "available");

    return updatedSlot;
  }

  /**
   * Handle expired requests (pending_approval → expired)
   */
  async handleExpiredRequest(
    slotId: string,
    requestId: string,
  ): Promise<TimeSlot> {
    const slot = await this.timeSlotRepository.findById(slotId);

    if (!slot || slot.status !== "pending_approval") {
      // Slot might have been already processed
      return slot;
    }

    // Update slot status
    const updatedSlot = await this.timeSlotRepository.updateStatus(
      slotId,
      "expired",
    );

    // Update request status
    await this.reservationRequestRepository.updateStatus(requestId, "expired");

    // Log state change
    await this.logStateChange(
      slotId,
      "pending_approval",
      "expired",
      requestId,
      "Timeout",
    );

    return updatedSlot;
  }

  /**
   * Get current slot status with details
   */
  async getSlotStatus(slotId: string): Promise<{
    slot: TimeSlot;
    pendingRequest?: ReservationRequest;
    activeReservations: number;
    timeUntilExpiry?: number; // milliseconds
  }> {
    const slot = await this.timeSlotRepository.findById(slotId);

    if (!slot) {
      throw new Error("Slot not found");
    }

    let pendingRequest: ReservationRequest | undefined;
    let timeUntilExpiry: number | undefined;

    if (slot.status === "pending_approval" && slot.expiresAt) {
      // Find the pending request for this slot
      pendingRequest =
        await this.reservationRequestRepository.findPendingBySlotId(slotId);
      timeUntilExpiry = slot.expiresAt.getTime() - Date.now();
    }

    const activeReservations = slot.currentReservations;

    return {
      slot,
      pendingRequest,
      activeReservations,
      timeUntilExpiry,
    };
  }

  /**
   * Bulk update slot statuses (for admin operations)
   */
  async bulkUpdateStatus(
    slotIds: string[],
    newStatus: SlotStatus,
    reason?: string,
  ): Promise<TimeSlot[]> {
    const updatedSlots: TimeSlot[] = [];

    for (const slotId of slotIds) {
      try {
        let updatedSlot: TimeSlot;

        switch (newStatus) {
          case "available":
            updatedSlot = await this.timeSlotRepository.updateStatus(
              slotId,
              "available",
            );
            break;
          case "blocked":
            updatedSlot = await this.blockSlot(slotId, reason || "Admin block");
            break;
          default:
            throw new Error(`Cannot bulk update to status: ${newStatus}`);
        }

        updatedSlots.push(updatedSlot);
      } catch (error) {
        console.error(`Failed to update slot ${slotId}:`, error);
      }
    }

    return updatedSlots;
  }

  // Private helper methods

  private async scheduleExpiration(slotId: string, requestId: string) {
    // Schedule Inngest workflow for request expiration
    const slot = await this.timeSlotRepository.findById(slotId);
    if (slot?.expiresAt) {
      await this.inngestEventService.scheduleRequestExpiration({
        slotId,
        requestId,
        expiresAt: slot.expiresAt.toISOString(),
      });
    }
  }

  private async cancelExpiration(slotId: string) {
    // Cancel scheduled expiration workflow
    await this.inngestEventService.cancelRequestExpiration({ slotId });
  }

  private async logStateChange(
    slotId: string,
    fromStatus: SlotStatus,
    toStatus: SlotStatus,
    relatedId?: string,
    reason?: string,
  ) {
    // Log state change for audit trail
    console.log(
      `[SlotState] ${slotId}: ${fromStatus} → ${toStatus}${relatedId ? ` (${relatedId})` : ""}${reason ? ` [${reason}]` : ""}`,
    );

    // Store in audit log (implementation depends on audit system)
    await this.auditService.logSlotStateChange({
      slotId,
      fromStatus,
      toStatus,
      relatedId,
      reason,
      timestamp: new Date(),
    });
  }
}
```

## 📊 State Monitoring

### Real-time Status Tracking

```typescript
// Monitor slot state changes
export const monitorSlotStates = async (profileId: string) => {
  const stats = await getSlotStatistics(profileId);

  return {
    totalSlots: stats.total,
    available: stats.available,
    pendingApproval: stats.pendingApproval,
    reserved: stats.reserved,
    expired: stats.expired,
    blocked: stats.blocked,
    approvalRate: stats.approvalRate,
    averageApprovalTime: stats.averageApprovalTime,
  };
};
```

### Slot Conflict Detection

```typescript
// Detect potential conflicts
export const detectSlotConflicts = async (slotId: string) => {
  const conflicts = await checkForConflicts(slotId);

  return {
    hasConflicts: conflicts.length > 0,
    conflicts: conflicts.map((conflict) => ({
      type: conflict.type,
      severity: conflict.severity,
      description: conflict.description,
      resolution: conflict.resolution,
    })),
  };
};
```

## 🚨 Error Handling

### State Transition Errors

```typescript
export class SlotStateError extends Error {
  constructor(
    public slotId: string,
    public currentStatus: SlotStatus,
    public attemptedTransition: string,
    message: string,
  ) {
    super(`Slot ${slotId}: ${message}`);
    this.name = "SlotStateError";
  }
}

// Usage examples:
throw new SlotStateError(
  slotId,
  "available",
  "approve",
  "Cannot approve an available slot",
);
throw new SlotStateError(
  slotId,
  "reserved",
  "request",
  "Cannot request a reserved slot",
);
```

## 📈 Performance Optimization

### Bulk Operations

```typescript
// Bulk slot state updates
export const bulkUpdateSlotStates = async (
  updates: Array<{
    slotId: string;
    newStatus: SlotStatus;
    reason?: string;
  }>,
) => {
  return await Promise.allSettled(
    updates.map((update) =>
      slotStateService.updateStatus(
        update.slotId,
        update.newStatus,
        update.reason,
      ),
    ),
  );
};
```

### Caching Strategy

```typescript
// Cache frequently accessed slot states
const slotCache = new Map<string, { data: TimeSlot; timestamp: number }>();

export const getCachedSlotStatus = async (
  slotId: string,
): Promise<TimeSlot | null> => {
  const cached = slotCache.get(slotId);

  if (cached && Date.now() - cached.timestamp < 5000) {
    // 5 second cache
    return cached.data;
  }

  const slot = await timeSlotRepository.findById(slotId);
  if (slot) {
    slotCache.set(slotId, { data: slot, timestamp: Date.now() });
  }

  return slot;
};
```

## 🎯 Success Metrics

### Performance KPIs

- **State transition speed**: < 100ms average
- **Conflict resolution time**: < 5 seconds
- **Cache hit rate**: > 90%
- **Error rate**: < 0.1%

### Reliability Metrics

- **State consistency**: 100%
- **Audit trail completeness**: 100%
- **Expiration handling accuracy**: > 99%
- **Bulk operation success rate**: > 99%

## 🔄 Integration Points

### With Reservation Service

- Request creation triggers slot state change
- Approval/rejection updates slot status
- Cancellation returns slot to available

### With Inngest Workflows

- Expiration workflows handle timeouts
- State changes trigger notifications
- Audit logging for all transitions

### With Doctor Dashboard

- Real-time status updates
- Conflict detection and resolution
- Statistics and analytics

## 📚 Next Steps

1. **Implement availability service** for doctor scheduling rules
2. **Create Inngest workflows** for expiration handling
3. **Build doctor dashboard** with real-time updates
4. **Add conflict resolution** UI components
5. **Test complete state machine** with edge cases

**Slot State Management: Foundation for request/approval system** ✅
