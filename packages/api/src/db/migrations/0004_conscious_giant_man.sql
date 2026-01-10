CREATE TABLE "medical_service" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"duration" integer NOT NULL,
	"price" numeric(10, 2),
	"category" varchar(100),
	"requirements" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_slot" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"max_reservations" integer DEFAULT 1 NOT NULL,
	"current_reservations" integer DEFAULT 0 NOT NULL,
	"status" varchar(50) DEFAULT 'available' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "reservation_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"patient_name" varchar(255) NOT NULL,
	"patient_phone" varchar(50) NOT NULL,
	"patient_email" varchar(255),
	"patient_age" integer,
	"patient_gender" varchar(20),
	"chief_complaint" text,
	"symptoms" text,
	"medical_history" text,
	"current_medications" text,
	"allergies" text,
	"urgency_level" varchar(20) DEFAULT 'normal',
	"preferred_contact_method" varchar(20) DEFAULT 'whatsapp',
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"requested_time" timestamp NOT NULL,
	"expires_at" timestamp NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"slot_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"request_id" uuid,
	"patient_name" varchar(255) NOT NULL,
	"patient_phone" varchar(50) NOT NULL,
	"patient_email" varchar(255),
	"status" varchar(50) DEFAULT 'confirmed' NOT NULL,
	"source" varchar(50) DEFAULT 'whatsapp',
	"notes" text,
	"reminder_24h_sent" boolean DEFAULT false,
	"reminder_2h_sent" boolean DEFAULT false,
	"reminder_24h_scheduled" boolean DEFAULT false,
	"reminder_2h_scheduled" boolean DEFAULT false,
	"completed_at" timestamp,
	"no_show" boolean DEFAULT false,
	"price_at_booking" numeric(10, 2),
	"payment_status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"cancelled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "availability_rule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"slot_duration" integer DEFAULT 30 NOT NULL,
	"buffer_time" integer DEFAULT 0,
	"max_appointments_per_slot" integer DEFAULT 1,
	"is_active" boolean DEFAULT true NOT NULL,
	"effective_from" timestamp DEFAULT now() NOT NULL,
	"effective_to" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "medical_service" ADD CONSTRAINT "medical_service_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slot" ADD CONSTRAINT "time_slot_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_slot" ADD CONSTRAINT "time_slot_service_id_medical_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."medical_service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_request" ADD CONSTRAINT "reservation_request_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_request" ADD CONSTRAINT "reservation_request_slot_id_time_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."time_slot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_request" ADD CONSTRAINT "reservation_request_service_id_medical_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."medical_service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation_request" ADD CONSTRAINT "reservation_request_approved_by_profile_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."profile"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_slot_id_time_slot_id_fk" FOREIGN KEY ("slot_id") REFERENCES "public"."time_slot"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_service_id_medical_service_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."medical_service"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservation" ADD CONSTRAINT "reservation_request_id_reservation_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."reservation_request"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_rule" ADD CONSTRAINT "availability_rule_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_medical_service_profile_id" ON "medical_service" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_medical_service_category" ON "medical_service" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_medical_service_active" ON "medical_service" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_time_slot_profile_id" ON "time_slot" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_time_slot_service_id" ON "time_slot" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "idx_time_slot_start_time" ON "time_slot" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "idx_time_slot_status" ON "time_slot" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_time_slot_expires" ON "time_slot" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_request_profile_id" ON "reservation_request" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_request_slot_id" ON "reservation_request" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "idx_request_status" ON "reservation_request" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_request_expires" ON "reservation_request" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_request_patient_phone" ON "reservation_request" USING btree ("patient_phone");--> statement-breakpoint
CREATE INDEX "idx_reservation_profile_id" ON "reservation" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_reservation_slot_id" ON "reservation" USING btree ("slot_id");--> statement-breakpoint
CREATE INDEX "idx_reservation_status" ON "reservation" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_reservation_patient_phone" ON "reservation" USING btree ("patient_phone");--> statement-breakpoint
CREATE INDEX "idx_reservation_created" ON "reservation" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_availability_profile_id" ON "availability_rule" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "idx_availability_day" ON "availability_rule" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "idx_availability_active" ON "availability_rule" USING btree ("is_active");