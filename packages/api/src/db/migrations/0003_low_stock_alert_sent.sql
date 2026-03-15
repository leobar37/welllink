-- Custom SQL migration file, put your code below!
-- Low stock alert tracking table
-- Prevents sending duplicate low stock alerts for the same product
-- until stock changes (replenished)

CREATE TABLE "low_stock_alert_sent" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "profile_id" uuid NOT NULL REFERENCES "profile" ("id") ON DELETE CASCADE,
    "product_id" uuid NOT NULL REFERENCES "product" ("id") ON DELETE CASCADE,
    "stock_at_alert" integer,
    "sent_at" timestamp NOT NULL DEFAULT NOW(),
    "created_at" timestamp NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX "low_stock_alert_sent_profile_id_idx" ON "low_stock_alert_sent" ("profile_id");
CREATE INDEX "low_stock_alert_sent_product_id_idx" ON "low_stock_alert_sent" ("product_id");
CREATE UNIQUE INDEX "low_stock_alert_sent_profile_product_unique_idx" ON "low_stock_alert_sent" ("profile_id", "product_id");
