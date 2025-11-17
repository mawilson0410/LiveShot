import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

// So I can use .env for environment variables
dotenv.config();
const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

// Initialize SQL connection with env variables. Using a tagged template literal to avoid SQL injection security issues.
export const sql = neon(
    `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require&channel_binding=require`
);

// Create SQL database tables if they don't exist already
export async function initializeDatabase() {
    try {
      // Create player table
      await sql`
        CREATE TABLE IF NOT EXISTS player (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            team TEXT,
            number TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      // Create test preset table
      await sql`
        CREATE TABLE IF NOT EXISTS test_preset (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            key TEXT NOT NULL,
            description TEXT NOT NULL,
            total_shots INTEGER NOT NULL
        )
      `;

      // Create test table with foreign key to player
      await sql`
        CREATE TABLE IF NOT EXISTS test (
            id BIGSERIAL PRIMARY KEY,
            player_id BIGINT NOT NULL REFERENCES player(id) ON DELETE CASCADE,
            test_preset_id BIGINT NOT NULL REFERENCES test_preset(id) ON DELETE CASCADE,
            total_makes INTEGER NOT NULL DEFAULT 0,
            total_attempts INTEGER NOT NULL DEFAULT 0,
            started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            completed_at TIMESTAMPTZ
        )
      `;

      // Create test preset locations table
      await sql`
        CREATE TABLE IF NOT EXISTS test_preset_locations (
            id BIGSERIAL PRIMARY KEY,
            test_preset_id BIGINT NOT NULL REFERENCES test_preset(id) ON DELETE CASCADE,
            location_name TEXT NOT NULL,
            location_key TEXT NOT NULL,
            shot_order INTEGER NOT NULL,
            shot_value INTEGER NOT NULL,
            planned_shots INTEGER NOT NULL
        )
      `;

      // Create shot table with foreign key to test
      await sql`
        CREATE TABLE IF NOT EXISTS shot (
            id BIGSERIAL PRIMARY KEY,
            test_id BIGINT NOT NULL REFERENCES test(id) ON DELETE CASCADE,
            shot_index INTEGER NOT NULL,
            court_location TEXT NOT NULL CHECK (court_location IN ('left_corner', 'left_wing', 'top', 'right_wing', 'right_corner', 'left_corner_key', 'left_wing_key', 'top_key', 'right_wing_key', 'right_corner_key')),
            made BOOLEAN NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;

      // Indexes for better query performance
      await sql`
        CREATE INDEX IF NOT EXISTS idx_test_player_id ON test(player_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_shot_test_id ON shot(test_id)
      `;

      await sql`
        CREATE INDEX IF NOT EXISTS idx_test_started_at ON test(started_at)
      `;

      console.log("Database initialized successfully");
    } catch (error) {
      console.log("Error initializing database", error);
    }
  }