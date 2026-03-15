import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env" });

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  
  console.log("Adding missing columns and tables to support inventory...");
  
  try {
    // Profile table columns
    await sql.unsafe(`
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS business_name varchar(100);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS business_address text;
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS business_phone varchar(20);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS business_email varchar(255);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS business_website varchar(255);
      ALTER TABLE profile ADD COLUMN IF NOT EXISTS business_tax_id varchar(20);
    `);
    console.log("✅ Profile columns added");
  } catch (e: any) {
    console.log("⚠️  Profile columns:", e.message);
  }

  try {
    // Client table columns
    await sql.unsafe(`
      ALTER TABLE client ADD COLUMN IF NOT EXISTS birthday date;
      ALTER TABLE client ADD COLUMN IF NOT EXISTS registration_date timestamp;
    `);
    console.log("✅ Client columns added");
  } catch (e: any) {
    console.log("⚠️  Client columns:", e.message);
  }

  try {
    // Reservation table columns (staff_id, customer_name, etc.)
    await sql.unsafe(`
      ALTER TABLE reservation ADD COLUMN IF NOT EXISTS staff_id uuid;
      ALTER TABLE reservation ADD COLUMN IF NOT EXISTS customer_name varchar(255);
      ALTER TABLE reservation ADD COLUMN IF NOT EXISTS customer_phone varchar(50);
      ALTER TABLE reservation ADD COLUMN IF NOT EXISTS customer_email varchar(255);
    `);
    console.log("✅ Reservation columns added");
  } catch (e: any) {
    console.log("⚠️  Reservation columns:", e.message);
  }

  // Create inventory tables if they don't exist
  try {
    await sql.unsafe(`
      -- Create service table (required for service_product)
      CREATE TABLE IF NOT EXISTS service (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
        name varchar(100) NOT NULL,
        description text,
        duration integer NOT NULL DEFAULT 30,
        price numeric(10, 2) NOT NULL DEFAULT 0,
        currency varchar(3) NOT NULL DEFAULT 'PEN',
        category varchar(50),
        requirements text,
        is_active boolean NOT NULL DEFAULT true,
        display_order integer NOT NULL DEFAULT 0,
        metadata jsonb DEFAULT '{}',
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS service_profile_id_idx ON service(profile_id);
    `);
    console.log("✅ Service table created");
  } catch (e: any) {
    console.log("⚠️  Service table:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Create product table
      CREATE TABLE IF NOT EXISTS product (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
        sku varchar(50) NOT NULL,
        name varchar(255) NOT NULL,
        description text,
        price decimal(10, 2) NOT NULL,
        cost decimal(10, 2),
        unit varchar(20) DEFAULT 'piece',
        min_stock integer DEFAULT 0,
        category_id uuid,
        supplier_id uuid,
        barcode varchar(100),
        has_expiration boolean DEFAULT false,
        expiration_days integer,
        brand varchar(100),
        notes text,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now(),
        deleted_at timestamp
      );
      CREATE INDEX IF NOT EXISTS product_profile_id_idx ON product(profile_id);
      CREATE INDEX IF NOT EXISTS product_sku_idx ON product(sku);
      CREATE UNIQUE INDEX IF NOT EXISTS product_profile_sku_idx ON product(profile_id, sku);
    `);
    console.log("✅ Product table created");
  } catch (e: any) {
    console.log("⚠️  Product table:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Create supplier table
      CREATE TABLE IF NOT EXISTS supplier (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
        name varchar(255) NOT NULL,
        contact_person varchar(255),
        phone varchar(20),
        email varchar(255),
        address text,
        city varchar(100),
        country varchar(100),
        tax_id varchar(50),
        payment_terms varchar(100),
        notes text,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS supplier_profile_id_idx ON supplier(profile_id);
    `);
    console.log("✅ Supplier table created");
  } catch (e: any) {
    console.log("⚠️  Supplier table:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Create product_category table
      CREATE TABLE IF NOT EXISTS product_category (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
        name varchar(100) NOT NULL,
        description text,
        color varchar(7),
        icon varchar(50),
        sort_order integer DEFAULT 0,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS product_category_profile_id_idx ON product_category(profile_id);
    `);
    console.log("✅ Product category table created");
  } catch (e: any) {
    console.log("⚠️  Product category table:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Create inventory_item table
      CREATE TABLE IF NOT EXISTS inventory_item (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        location varchar(100) NOT NULL DEFAULT 'default',
        quantity integer NOT NULL DEFAULT 0,
        reserved_quantity integer NOT NULL DEFAULT 0,
        average_cost decimal(10, 2),
        last_restocked_at timestamp,
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS inventory_item_product_location_idx ON inventory_item(profile_id, product_id, location);
    `);
    console.log("✅ Inventory item table created");
  } catch (e: any) {
    console.log("⚠️  Inventory item table:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Create stock_movement table
      CREATE TABLE IF NOT EXISTS stock_movement (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        inventory_item_id uuid NOT NULL REFERENCES inventory_item(id) ON DELETE CASCADE,
        quantity integer NOT NULL,
        reason varchar(50) NOT NULL,
        location varchar(100),
        reference_type varchar(50),
        reference_id uuid,
        notes text,
        user_id uuid,
        created_at timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS stock_movement_product_id_idx ON stock_movement(product_id);
    `);
    console.log("✅ Stock movement table created");
  } catch (e: any) {
    console.log("⚠️  Stock movement table:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Create service_product table
      CREATE TABLE IF NOT EXISTS service_product (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
        service_id uuid NOT NULL REFERENCES service(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        quantity_required integer NOT NULL DEFAULT 1,
        is_required boolean DEFAULT true,
        notes varchar(500),
        is_active boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS service_product_service_product_idx ON service_product(service_id, product_id);
    `);
    console.log("✅ Service product table created");
  } catch (e: any) {
    console.log("⚠️  Service product table:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Create purchase_order table
      CREATE TABLE IF NOT EXISTS purchase_order (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
        supplier_id uuid NOT NULL REFERENCES supplier(id) ON DELETE CASCADE,
        order_number varchar(50),
        status varchar(50) DEFAULT 'draft',
        expected_date timestamp,
        received_date timestamp,
        tax decimal(10, 2),
        notes text,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS purchase_order_profile_id_idx ON purchase_order(profile_id);
    `);
    console.log("✅ Purchase order table created");
  } catch (e: any) {
    console.log("⚠️  Purchase order table:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Create purchase_order_item table
      CREATE TABLE IF NOT EXISTS purchase_order_item (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        purchase_order_id uuid NOT NULL REFERENCES purchase_order(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        quantity integer NOT NULL,
        unit_price decimal(10, 2),
        received_quantity integer DEFAULT 0,
        notes text,
        created_at timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS purchase_order_item_order_id_idx ON purchase_order_item(purchase_order_id);
    `);
    console.log("✅ Purchase order item table created");
  } catch (e: any) {
    console.log("⚠️  Purchase order item table:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Add foreign keys for product table
      ALTER TABLE product ADD CONSTRAINT fk_product_category FOREIGN KEY (category_id) REFERENCES product_category(id) ON DELETE SET NULL;
      ALTER TABLE product ADD CONSTRAINT fk_product_supplier FOREIGN KEY (supplier_id) REFERENCES supplier(id) ON DELETE SET NULL;
    `);
    console.log("✅ Product foreign keys added");
  } catch (e: any) {
    console.log("⚠️  Product foreign keys:", e.message);
  }

  try {
    await sql.unsafe(`
      -- Create low_stock_alert_sent table
      CREATE TABLE IF NOT EXISTS low_stock_alert_sent (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        profile_id uuid NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES product(id) ON DELETE CASCADE,
        inventory_item_id uuid NOT NULL REFERENCES inventory_item(id) ON DELETE CASCADE,
        quantity_at_alert integer NOT NULL,
        threshold_at_alert integer NOT NULL,
        sent_at timestamp DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS low_stock_alert_sent_product_id_idx ON low_stock_alert_sent(product_id);
    `);
    console.log("✅ Low stock alert sent table created");
  } catch (e: any) {
    console.log("⚠️  Low stock alert sent table:", e.message);
  }
  
  console.log("Done!");
  await sql.end();
}

main();
