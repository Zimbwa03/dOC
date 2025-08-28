import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import * as schema from "../shared/schema";

// Database connection
const pool = new Pool({
  connectionString: "postgresql://postgres:Ngonidzashe2003.@db.ffbbdzkiqnvxyxmmkuft.supabase.co:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  },
});

const db = drizzle(pool, { schema });

async function setupDatabase() {
  try {
    console.log("Connecting to database...");
    
    // Test connection
    const client = await pool.connect();
    console.log("Database connection successful!");
    
    // Check if tables exist
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('doctors', 'patients', 'consultations', 'patient_health_plans', 'ai_interactions', 'doctor_analytics')
    `;
    
    const tablesResult = await client.query(tablesQuery);
    const existingTables = tablesResult.rows.map(row => row.table_name);
    
    console.log("Existing tables:", existingTables);
    
    // Create tables if they don't exist
    if (!existingTables.includes('doctors')) {
      console.log("Creating doctors table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS doctors (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR NOT NULL UNIQUE,
          full_name VARCHAR NOT NULL,
          password TEXT NOT NULL,
          specialization VARCHAR NOT NULL,
          practice_name VARCHAR,
          phone_number VARCHAR,
          voice_sample_url VARCHAR,
          voice_id VARCHAR,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
    
    if (!existingTables.includes('patients')) {
      console.log("Creating patients table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS patients (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          full_name VARCHAR NOT NULL,
          phone_number VARCHAR NOT NULL UNIQUE,
          doctor_id UUID REFERENCES doctors(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
    
    if (!existingTables.includes('consultations')) {
      console.log("Creating consultations table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS consultations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          doctor_id UUID NOT NULL REFERENCES doctors(id),
          patient_id UUID NOT NULL REFERENCES patients(id),
          consultation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          duration_minutes INTEGER,
          transcript TEXT,
          doctor_notes TEXT,
          ai_suggestions TEXT,
          diagnosis TEXT,
          prescriptions JSONB,
          accuracy_score DECIMAL(3,2),
          status VARCHAR DEFAULT 'completed'
        );
      `);
    }
    
    if (!existingTables.includes('patient_health_plans')) {
      console.log("Creating patient_health_plans table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS patient_health_plans (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          patient_id UUID NOT NULL REFERENCES patients(id),
          consultation_id UUID REFERENCES consultations(id),
          medications JSONB,
          diet_plan TEXT,
          exercise_plan TEXT,
          reminders JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
    
    if (!existingTables.includes('ai_interactions')) {
      console.log("Creating ai_interactions table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_interactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          patient_id UUID REFERENCES patients(id),
          doctor_id UUID REFERENCES doctors(id),
          message TEXT NOT NULL,
          response TEXT NOT NULL,
          interaction_type VARCHAR DEFAULT 'chat',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);
    }
    
    if (!existingTables.includes('doctor_analytics')) {
      console.log("Creating doctor_analytics table...");
      await client.query(`
        CREATE TABLE IF NOT EXISTS doctor_analytics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          doctor_id UUID NOT NULL REFERENCES doctors(id),
          week_start TIMESTAMP WITH TIME ZONE NOT NULL,
          patients_seen INTEGER DEFAULT 0,
          consultation_hours DECIMAL(4,2) DEFAULT 0,
          average_accuracy DECIMAL(3,2) DEFAULT 0,
          revenue DECIMAL(10,2) DEFAULT 0,
          recommended_journals JSONB
        );
      `);
    }
    
    // Create indexes for better performance
    console.log("Creating indexes...");
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_doctors_email ON doctors(email);
      CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone_number);
      CREATE INDEX IF NOT EXISTS idx_patients_doctor ON patients(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_consultations_doctor ON consultations(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_consultations_patient ON consultations(patient_id);
      CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(consultation_date);
      CREATE INDEX IF NOT EXISTS idx_analytics_doctor_week ON doctor_analytics(doctor_id, week_start);
    `);
    
    console.log("Database setup completed successfully!");
    
    // Insert sample data for testing
    console.log("Inserting sample data...");
    
    // Check if sample doctor exists
    const doctorCheck = await client.query("SELECT id FROM doctors WHERE email = 'test@docdot.com' LIMIT 1");
    
    if (doctorCheck.rows.length === 0) {
      const bcrypt = await import('bcrypt');
      const hashedPassword = await bcrypt.default.hash('password123', 10);
      
      await client.query(`
        INSERT INTO doctors (email, full_name, password, specialization, practice_name, phone_number)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, ['test@docdot.com', 'Dr. Test Doctor', hashedPassword, 'General Medicine', 'Test Practice', '+1234567890']);
      
      console.log("Sample doctor created");
    }
    
    client.release();
    
  } catch (error) {
    console.error("Database setup failed:", error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => {
      console.log("Database setup completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Database setup failed:", error);
      process.exit(1);
    });
}

export { setupDatabase };
