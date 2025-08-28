import { drizzle } from "drizzle-orm/node-postgres";
import { 
  doctors, 
  patients, 
  consultations, 
  patientHealthPlans, 
  aiInteractions, 
  doctorAnalytics,
  type Doctor,
  type Patient,
  type Consultation,
  type PatientHealthPlan,
  type AiInteraction,
  type DoctorAnalytics,
  type InsertDoctor,
  type InsertPatient,
  type InsertConsultation,
  type InsertPatientHealthPlan,
  type InsertAiInteraction,
  type InsertDoctorAnalytics
} from "@shared/schema";
import { eq, and, desc, gte, sql } from "drizzle-orm";
import pg from "pg";
import bcrypt from "bcrypt";

const { Pool } = pg;

// Database connection - using the provided connection string
const pool = new Pool({
  connectionString: "postgresql://postgres:Ngonidzashe2003.@db.ffbbdzkiqnvxyxmmkuft.supabase.co:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const db = drizzle(pool);

export interface IStorage {
  // Doctor operations
  getDoctorById(id: string): Promise<Doctor | undefined>;
  getDoctorByEmail(email: string): Promise<Doctor | undefined>;
  createDoctor(doctor: InsertDoctor): Promise<Doctor>;
  updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor | undefined>;

  // Patient operations
  getPatientById(id: string): Promise<Patient | undefined>;
  getPatientByPhone(phoneNumber: string): Promise<Patient | undefined>;
  createPatient(patient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined>;
  getPatientsByDoctorId(doctorId: string): Promise<Patient[]>;

  // Consultation operations
  getConsultationById(id: string): Promise<Consultation | undefined>;
  createConsultation(consultation: InsertConsultation): Promise<Consultation>;
  updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | undefined>;
  getConsultationsByDoctorId(doctorId: string, limit?: number): Promise<Consultation[]>;
  getConsultationsByPatientId(patientId: string, limit?: number): Promise<Consultation[]>;
  getLatestConsultationByPatientId(patientId: string): Promise<Consultation | undefined>;

  // Health plan operations
  getHealthPlanByPatientId(patientId: string): Promise<PatientHealthPlan | undefined>;
  createHealthPlan(healthPlan: InsertPatientHealthPlan): Promise<PatientHealthPlan>;
  updateHealthPlan(id: string, updates: Partial<PatientHealthPlan>): Promise<PatientHealthPlan | undefined>;

  // AI interaction operations
  createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction>;
  getAiInteractionsByPatientId(patientId: string): Promise<AiInteraction[]>;

  // Analytics operations
  getDoctorAnalytics(doctorId: string, weekStart?: Date): Promise<DoctorAnalytics[]>;
  createOrUpdateDoctorAnalytics(analytics: InsertDoctorAnalytics): Promise<DoctorAnalytics>;
  
  // Auth operations
  authenticateDoctor(email: string, password: string): Promise<Doctor | null>;
  authenticatePatient(fullName: string, phoneNumber: string): Promise<Patient | null>;
}

export class PostgresStorage implements IStorage {
  
  // Doctor operations
  async getDoctorById(id: string): Promise<Doctor | undefined> {
    const result = await db.select().from(doctors).where(eq(doctors.id, id)).limit(1);
    return result[0];
  }

  async getDoctorByEmail(email: string): Promise<Doctor | undefined> {
    const result = await db.select().from(doctors).where(eq(doctors.email, email)).limit(1);
    return result[0];
  }

  async createDoctor(doctor: InsertDoctor): Promise<Doctor> {
    const hashedPassword = await bcrypt.hash(doctor.password, 10);
    const result = await db.insert(doctors).values({
      ...doctor,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async updateDoctor(id: string, updates: Partial<Doctor>): Promise<Doctor | undefined> {
    const result = await db.update(doctors).set(updates).where(eq(doctors.id, id)).returning();
    return result[0];
  }

  // Update doctor's voice ID
  async updateDoctorVoiceId(doctorId: string, voiceId: string): Promise<void> {
    try {
      await db
        .update(doctors)
        .set({ voiceId })
        .where(eq(doctors.id, doctorId));
    } catch (error) {
      console.error('Error updating doctor voice ID:', error);
      throw new Error('Failed to update doctor voice ID');
    }
  }

  // Patient operations
  async getPatientById(id: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.id, id)).limit(1);
    return result[0];
  }

  async getPatientByPhone(phoneNumber: string): Promise<Patient | undefined> {
    const result = await db.select().from(patients).where(eq(patients.phoneNumber, phoneNumber)).limit(1);
    return result[0];
  }

  async createPatient(patient: InsertPatient): Promise<Patient> {
    const result = await db.insert(patients).values(patient).returning();
    return result[0];
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const result = await db.update(patients).set(updates).where(eq(patients.id, id)).returning();
    return result[0];
  }

  async getPatientsByDoctorId(doctorId: string): Promise<Patient[]> {
    return await db.select().from(patients).where(eq(patients.doctorId, doctorId));
  }

  // Consultation operations
  async getConsultationById(id: string): Promise<Consultation | undefined> {
    const result = await db.select().from(consultations).where(eq(consultations.id, id)).limit(1);
    return result[0];
  }

  async createConsultation(consultation: InsertConsultation): Promise<Consultation> {
    const result = await db.insert(consultations).values(consultation).returning();
    return result[0];
  }

  async updateConsultation(id: string, updates: Partial<Consultation>): Promise<Consultation | undefined> {
    const result = await db.update(consultations).set(updates).where(eq(consultations.id, id)).returning();
    return result[0];
  }

  async getConsultationsByDoctorId(doctorId: string, limit = 10): Promise<Consultation[]> {
    return await db.select()
      .from(consultations)
      .where(eq(consultations.doctorId, doctorId))
      .orderBy(desc(consultations.consultationDate))
      .limit(limit);
  }

  async getConsultationsByPatientId(patientId: string, limit = 10): Promise<Consultation[]> {
    return await db.select()
      .from(consultations)
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.consultationDate))
      .limit(limit);
  }

  async getLatestConsultationByPatientId(patientId: string): Promise<Consultation | undefined> {
    const result = await db.select()
      .from(consultations)
      .where(eq(consultations.patientId, patientId))
      .orderBy(desc(consultations.consultationDate))
      .limit(1);
    return result[0];
  }

  // Health plan operations
  async getHealthPlanByPatientId(patientId: string): Promise<PatientHealthPlan | undefined> {
    const result = await db.select()
      .from(patientHealthPlans)
      .where(eq(patientHealthPlans.patientId, patientId))
      .orderBy(desc(patientHealthPlans.createdAt))
      .limit(1);
    return result[0];
  }

  async createHealthPlan(healthPlan: InsertPatientHealthPlan): Promise<PatientHealthPlan> {
    const result = await db.insert(patientHealthPlans).values(healthPlan).returning();
    return result[0];
  }

  async updateHealthPlan(id: string, updates: Partial<PatientHealthPlan>): Promise<PatientHealthPlan | undefined> {
    const result = await db.update(patientHealthPlans).set(updates).where(eq(patientHealthPlans.id, id)).returning();
    return result[0];
  }

  // AI interaction operations
  async createAiInteraction(interaction: InsertAiInteraction): Promise<AiInteraction> {
    const result = await db.insert(aiInteractions).values(interaction).returning();
    return result[0];
  }

  async getAiInteractionsByPatientId(patientId: string): Promise<AiInteraction[]> {
    return await db.select()
      .from(aiInteractions)
      .where(eq(aiInteractions.patientId, patientId))
      .orderBy(desc(aiInteractions.createdAt));
  }

  // Analytics operations
  async getDoctorAnalytics(doctorId: string, weekStart?: Date): Promise<DoctorAnalytics[]> {
    let query = db.select().from(doctorAnalytics).where(eq(doctorAnalytics.doctorId, doctorId));
    
    if (weekStart) {
      query = db.select().from(doctorAnalytics).where(and(
        eq(doctorAnalytics.doctorId, doctorId),
        gte(doctorAnalytics.weekStart, weekStart)
      ));
    }
    
    return await query.orderBy(desc(doctorAnalytics.weekStart));
  }

  async createOrUpdateDoctorAnalytics(analytics: InsertDoctorAnalytics): Promise<DoctorAnalytics> {
    // Try to find existing analytics for the same week
    const existing = await db.select()
      .from(doctorAnalytics)
      .where(and(
        eq(doctorAnalytics.doctorId, analytics.doctorId),
        eq(doctorAnalytics.weekStart, analytics.weekStart)
      ))
      .limit(1);

    if (existing.length > 0) {
      // Update existing record
      const result = await db.update(doctorAnalytics)
        .set(analytics)
        .where(eq(doctorAnalytics.id, existing[0].id))
        .returning();
      return result[0];
    } else {
      // Create new record
      const result = await db.insert(doctorAnalytics).values(analytics).returning();
      return result[0];
    }
  }

  // Auth operations
  async authenticateDoctor(email: string, password: string): Promise<Doctor | null> {
    const doctor = await this.getDoctorByEmail(email);
    if (!doctor) return null;
    
    const isPasswordValid = await bcrypt.compare(password, doctor.password);
    if (!isPasswordValid) return null;
    
    return doctor;
  }

  async authenticatePatient(fullName: string, phoneNumber: string): Promise<Patient | null> {
    const result = await db.select()
      .from(patients)
      .where(and(
        eq(patients.fullName, fullName),
        eq(patients.phoneNumber, phoneNumber)
      ))
      .limit(1);
    
    return result[0] || null;
  }
}

export const storage = new PostgresStorage();
