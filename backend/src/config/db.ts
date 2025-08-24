// import { neon } from '@neondatabase/serverless';
// import dotenv from 'dotenv';

// dotenv.config();

// const DATABASE_URL = process.env.DATABASE_URL;

// if (!DATABASE_URL) {
//   throw new Error('DATABASE_URL is not defined');
// }

// export const sql = neon(DATABASE_URL);

// // Initialize database schema
// export const initializeDatabase = async () => {
//   try {
//     // Users table
//     await sql`
//       CREATE TABLE IF NOT EXISTS users (
//         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//         name VARCHAR(100) NOT NULL,
//         email VARCHAR(150) UNIQUE NOT NULL,
//         phone VARCHAR(15),
//         password_hash TEXT NOT NULL,
//         role VARCHAR(10) DEFAULT 'user',
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       )
//     `;

//     // Trains table
//     await sql`
//       CREATE TABLE IF NOT EXISTS trains (
//         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//         number VARCHAR(10) UNIQUE NOT NULL,
//         name VARCHAR(100) NOT NULL,
//         source VARCHAR(100) NOT NULL,
//         source_code VARCHAR(10) NOT NULL,
//         destination VARCHAR(100) NOT NULL,
//         destination_code VARCHAR(10) NOT NULL,
//         departure_time TIME NOT NULL,
//         arrival_time TIME NOT NULL,
//         duration VARCHAR(20) NOT NULL,
//         distance VARCHAR(20) NOT NULL,
//         running_days TEXT[] NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       )
//     `;

//     // Train classes table
//     await sql`
//       CREATE TABLE IF NOT EXISTS train_classes (
//         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//         train_id UUID REFERENCES trains(id) ON DELETE CASCADE,
//         class_type VARCHAR(5) NOT NULL,
//         total_seats INTEGER NOT NULL,
//         fare DECIMAL(10,2) NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//         UNIQUE(train_id, class_type)
//       )
//     `;

//     // Bookings table
//     await sql`
//       CREATE TABLE IF NOT EXISTS bookings (
//         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//         user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//         train_id UUID REFERENCES trains(id) ON DELETE CASCADE,
//         pnr VARCHAR(10) UNIQUE NOT NULL,
//         class_type VARCHAR(5) NOT NULL,
//         travel_date DATE NOT NULL,
//         booking_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
//         status VARCHAR(20) DEFAULT 'Confirmed',
//         total_fare DECIMAL(10,2) NOT NULL
//       )
//     `;

//     // Passengers table
//     await sql`
//       CREATE TABLE IF NOT EXISTS passengers (
//         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//         booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
//         name VARCHAR(100) NOT NULL,
//         age INTEGER NOT NULL,
//         gender VARCHAR(10) NOT NULL,
//         seat_number VARCHAR(10) NOT NULL,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       )
//     `;

//     console.log('Database schema initialized successfully');
//   } catch (error) {
//     console.error('Error initializing database schema:', error);
//     throw error;
//   }
// };

// // Initialize database on startup
// initializeDatabase().catch(console.error);

import { Pool } from "pg";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined");
}

export const pool = new Pool({
    connectionString: DATABASE_URL,
    // Optional: enable SSL for production environments
    ssl:
        process.env.NODE_ENV === "production"
            ? { rejectUnauthorized: false }
            : false,
});

export const initializeDatabase = async () => {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        phone VARCHAR(15),
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
        fare DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(train_id, class_type)
      )
    `);

        await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        train_id UUID REFERENCES trains(id) ON DELETE CASCADE,
        pnr VARCHAR(10) UNIQUE NOT NULL,
        class_type VARCHAR(5) NOT NULL,
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

        console.log("Database schema initialized successfully");
    } catch (error) {
        console.error("Error initializing database schema:", error);
        throw error;
    }
};

initializeDatabase().catch(console.error);
