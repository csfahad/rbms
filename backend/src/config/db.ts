import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

export const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl:
        process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: true }
            : false,
});

export const initializeDatabase = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(15) NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(10) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS trains (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        number VARCHAR(10) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        source VARCHAR(100) NOT NULL,
        source_code VARCHAR(10) NOT NULL,
        destination VARCHAR(100) NOT NULL,
        destination_code VARCHAR(10) NOT NULL,
        departure_time TIME NOT NULL,
        arrival_time TIME NOT NULL,
        duration VARCHAR(20) NOT NULL,
        distance VARCHAR(20) NOT NULL,
        running_days TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS train_classes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        train_id UUID REFERENCES trains(id) ON DELETE CASCADE,
        class_type VARCHAR(5) NOT NULL,
        total_seats INTEGER NOT NULL,
        fare NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT 'CURRENT_TIMESTAMP',
        available_seats INTEGER NOT NULL DEFAULT '0',
        UNIQUE(train_id, class_type)
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS train_stoppages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        train_id UUID REFERENCES trains(id) ON DELETE CASCADE,
        station_name VARCHAR(100) NOT NULL,
        station_code VARCHAR(10) NOT NULL,
        arrival_time TIME,
        departure_time TIME,
        stop_number INTEGER NOT NULL,
        platform_number VARCHAR(10),
        halt_duration_minutes INTEGER DEFAULT 0,
        distance_from_source DECIMAL(8,2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(train_id, stop_number),
        UNIQUE(train_id, station_code)
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        train_id UUID REFERENCES trains(id) ON DELETE CASCADE,
        pnr VARCHAR(10) UNIQUE NOT NULL,
        class_type VARCHAR(5) NOT NULL,
        source_station VARCHAR(100) NOT NULL,
        source_station_code VARCHAR(10) NOT NULL,
        destination_station VARCHAR(100) NOT NULL,
        destination_station_code VARCHAR(10) NOT NULL,
        travel_date DATE NOT NULL,
        booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(20) DEFAULT 'Confirmed',
        total_fare DECIMAL(10,2) NOT NULL
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS passengers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
        name VARCHAR(100) NOT NULL,
        age INTEGER NOT NULL,
        gender VARCHAR(10) NOT NULL,
        seat_number VARCHAR(10) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS used_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        token_hash VARCHAR(255) UNIQUE NOT NULL,
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL
      )
    `);

        // create index for performance on token lookups
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_used_reset_tokens_hash 
      ON used_reset_tokens(token_hash)
    `);

        // create index for cleanup of expired tokens
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_used_reset_tokens_expires 
      ON used_reset_tokens(expires_at)
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS support_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL,
        subject VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        admin_response TEXT,
        responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
        responded_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

        // create index for performance on support message queries
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_support_messages_status 
      ON support_messages(status)
    `);

        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_support_messages_created_at 
      ON support_messages(created_at DESC)
    `);

        // create indexes for train_classes table
        await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS train_classes_pkey 
      ON train_classes USING BTREE (id)
    `);

        await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS train_classes_train_id_class_type_key 
      ON train_classes USING BTREE (train_id, class_type)
    `);

        // create indexes for train_stoppages table
        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_train_stoppages_train_id 
      ON train_stoppages(train_id)
    `);

        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_train_stoppages_station_code 
      ON train_stoppages(station_code)
    `);

        await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_train_stoppages_stop_number 
      ON train_stoppages(train_id, stop_number)
    `);

        console.log("Database schema initialized successfully");
    } catch (error) {
        console.error("Error initializing database schema:", error);
        throw error;
    }
};

initializeDatabase().catch(console.error);
