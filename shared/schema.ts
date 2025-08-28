import { sql } from "drizzle-orm";
import { pgTable, text, varchar, uuid, timestamptz, integer, decimal, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Doctors table
export const doctors = pgTable("doctors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").notNull().unique(),
  fullName: varchar("full_name").notNull(),
  password: text("password").notNull(),
  specialization: varchar("specialization").notNull(),
  practiceName: varchar("practice_name"),
  phoneNumber: varchar("phone_number"),
  voiceSampleUrl: varchar("voice_sample_url"),
  createdAt: timestamptz("created_at").defaultNow(),
  updatedAt: timestamptz("updated_at").defaultNow(),
});

// Patients table
export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: varchar("full_name").notNull(),
  phoneNumber: varchar("phone_number").notNull().unique(),
  doctorId: uuid("doctor_id").references(() => doctors.id),
  createdAt: timestamptz("created_at").defaultNow(),
  updatedAt: timestamptz("updated_at").defaultNow(),
});

// Consultations table
export const consultations = pgTable("consultations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: uuid("doctor_id").references(() => doctors.id).notNull(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  consultationDate: timestamptz("consultation_date").defaultNow(),
  durationMinutes: integer("duration_minutes"),
  transcript: text("transcript"),
  doctorNotes: text("doctor_notes"),
  aiSuggestions: text("ai_suggestions"),
  diagnosis: text("diagnosis"),
  prescriptions: jsonb("prescriptions"),
  accuracyScore: decimal("accuracy_score", { precision: 3, scale: 2 }),
  status: varchar("status").default("completed"),
});

// Patient Health Plans table
export const patientHealthPlans = pgTable("patient_health_plans", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  consultationId: uuid("consultation_id").references(() => consultations.id),
  medications: jsonb("medications"),
  dietPlan: text("diet_plan"),
  exercisePlan: text("exercise_plan"),
  reminders: jsonb("reminders"),
  createdAt: timestamptz("created_at").defaultNow(),
});

// AI Interactions table
export const aiInteractions = pgTable("ai_interactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: uuid("patient_id").references(() => patients.id),
  doctorId: uuid("doctor_id").references(() => doctors.id),
  message: text("message").notNull(),
  response: text("response").notNull(),
  interactionType: varchar("interaction_type").default("chat"),
  createdAt: timestamptz("created_at").defaultNow(),
});

// Doctor Analytics table
export const doctorAnalytics = pgTable("doctor_analytics", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  doctorId: uuid("doctor_id").references(() => doctors.id).notNull(),
  weekStart: timestamptz("week_start").notNull(),
  patientsSeen: integer("patients_seen").default(0),
  consultationHours: decimal("consultation_hours", { precision: 4, scale: 2 }).default("0"),
  averageAccuracy: decimal("average_accuracy", { precision: 3, scale: 2 }).default("0"),
  revenue: decimal("revenue", { precision: 10, scale: 2 }).default("0"),
  recommendedJournals: jsonb("recommended_journals"),
});

// Insert schemas
export const insertDoctorSchema = createInsertSchema(doctors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConsultationSchema = createInsertSchema(consultations).omit({
  id: true,
  consultationDate: true,
});

export const insertPatientHealthPlanSchema = createInsertSchema(patientHealthPlans).omit({
  id: true,
  createdAt: true,
});

export const insertAiInteractionSchema = createInsertSchema(aiInteractions).omit({
  id: true,
  createdAt: true,
});

export const insertDoctorAnalyticsSchema = createInsertSchema(doctorAnalytics).omit({
  id: true,
});

// Types
export type Doctor = typeof doctors.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Consultation = typeof consultations.$inferSelect;
export type PatientHealthPlan = typeof patientHealthPlans.$inferSelect;
export type AiInteraction = typeof aiInteractions.$inferSelect;
export type DoctorAnalytics = typeof doctorAnalytics.$inferSelect;

export type InsertDoctor = z.infer<typeof insertDoctorSchema>;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type InsertConsultation = z.infer<typeof insertConsultationSchema>;
export type InsertPatientHealthPlan = z.infer<typeof insertPatientHealthPlanSchema>;
export type InsertAiInteraction = z.infer<typeof insertAiInteractionSchema>;
export type InsertDoctorAnalytics = z.infer<typeof insertDoctorAnalyticsSchema>;
