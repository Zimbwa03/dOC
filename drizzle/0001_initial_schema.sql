
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create doctors table
CREATE TABLE IF NOT EXISTS "doctors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar NOT NULL UNIQUE,
	"full_name" varchar NOT NULL,
	"password" text NOT NULL,
	"specialization" varchar NOT NULL,
	"practice_name" varchar,
	"phone_number" varchar,
	"voice_sample_url" varchar,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS "patients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar NOT NULL,
	"phone_number" varchar NOT NULL UNIQUE,
	"doctor_id" uuid REFERENCES "doctors"("id"),
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);

-- Create consultations table
CREATE TABLE IF NOT EXISTS "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid REFERENCES "doctors"("id") NOT NULL,
	"patient_id" uuid REFERENCES "patients"("id") NOT NULL,
	"consultation_date" timestamp with time zone DEFAULT now(),
	"duration_minutes" integer,
	"transcript" text,
	"doctor_notes" text,
	"ai_suggestions" text,
	"diagnosis" text,
	"prescriptions" jsonb,
	"accuracy_score" decimal(3,2),
	"status" varchar DEFAULT 'completed'
);

-- Create patient_health_plans table
CREATE TABLE IF NOT EXISTS "patient_health_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid REFERENCES "patients"("id") NOT NULL,
	"consultation_id" uuid REFERENCES "consultations"("id"),
	"medications" jsonb,
	"diet_plan" text,
	"exercise_plan" text,
	"reminders" jsonb,
	"created_at" timestamp with time zone DEFAULT now()
);

-- Create ai_interactions table
CREATE TABLE IF NOT EXISTS "ai_interactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid REFERENCES "patients"("id"),
	"doctor_id" uuid REFERENCES "doctors"("id"),
	"message" text NOT NULL,
	"response" text NOT NULL,
	"interaction_type" varchar DEFAULT 'chat',
	"created_at" timestamp with time zone DEFAULT now()
);

-- Create doctor_analytics table
CREATE TABLE IF NOT EXISTS "doctor_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"doctor_id" uuid REFERENCES "doctors"("id") NOT NULL,
	"week_start" timestamp with time zone NOT NULL,
	"patients_seen" integer DEFAULT 0,
	"consultation_hours" decimal(4,2) DEFAULT 0,
	"average_accuracy" decimal(3,2) DEFAULT 0,
	"revenue" decimal(10,2) DEFAULT 0,
	"recommended_journals" jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_patients_doctor_id" ON "patients"("doctor_id");
CREATE INDEX IF NOT EXISTS "idx_consultations_doctor_id" ON "consultations"("doctor_id");
CREATE INDEX IF NOT EXISTS "idx_consultations_patient_id" ON "consultations"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_ai_interactions_patient_id" ON "ai_interactions"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_doctor_analytics_doctor_id" ON "doctor_analytics"("doctor_id");
