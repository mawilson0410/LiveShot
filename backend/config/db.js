import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";

dotenv.config();

const { PGHOST, PGDATABASE, PGUSER, PGPASSWORD } = process.env;

// Initialize SQL connection with env variables. Using a tagged template literal to avoid SQL injection security issues.
export const sql = neon(
    `postgres://${PGUSER}:${PGPASSWORD}@${PGHOST}/${PGDATABASE}?sslmode=require&channel_binding=require`
);

// Create SQL database tables if they dont't exist already
export async function initializeDatabase() {
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            password VARCHAR(255) NOT NULL
        )
      `;

      console.log("Database initialized successfully");
    } catch (error) {
      console.log("Error initializing database", error);
    }
  }