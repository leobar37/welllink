-- Add staff_id column to reservation table for staff integration
ALTER TABLE "reservation" ADD COLUMN "staff_id" uuid REFERENCES "staff"("id") ON DELETE SET NULL;

-- Add index for staff_id
CREATE INDEX "idx_reservation_staff_id" ON "reservation"("staff_id");
