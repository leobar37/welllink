-- Custom SQL migration file, put your code below!
-- Service-Product junction table
-- Links services to the products they consume with quantity_required
-- Used for inventory tracking - when a service is performed, 
-- the associated products are consumed from inventory

CREATE TABLE "service_product" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profile" ("id") ON DELETE CASCADE,
    "service_id" uuid NOT NULL REFERENCES "service" ("id") ON DELETE CASCADE,
    "product_id" uuid NOT NULL REFERENCES "product" ("id") ON DELETE CASCADE,
    "quantity_required" integer NOT NULL DEFAULT 1,
    "is_required" boolean NOT NULL DEFAULT true,
    "notes" varchar(500),
    "is_active" boolean NOT NULL DEFAULT true,
    "created_at" timestamp NOT NULL DEFAULT NOW(),
    "updated_at" timestamp NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX "service_product_profile_id_idx" ON "service_product" ("profile_id");
CREATE INDEX "service_product_service_id_idx" ON "service_product" ("service_id");
CREATE INDEX "service_product_product_id_idx" ON "service_product" ("product_id");
CREATE INDEX "service_product_is_active_idx" ON "service_product" ("is_active");

-- Unique constraint: one product-service association per service
CREATE UNIQUE INDEX "service_product_service_product_unique_idx" ON "service_product" ("service_id", "product_id");
