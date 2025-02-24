import { DB_USER, DB_PASSWORD, DB_NAME, DB_HOST, DB_PORT } from "../../config.ts";
import { PostgresClient } from "./PostgresClient.ts";

export let dbClient: PostgresClient | null = null;
// Retry function to connect to the database
export async function connectToDatabase(retries = 5, delay = 5000) {
  if (dbClient) return dbClient;
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to DB (Attempt ${i + 1})...`);
      dbClient = new PostgresClient(
        DB_USER,
        DB_PASSWORD,
        DB_NAME,
        DB_HOST,
        DB_PORT,
      );

      await dbClient.connect();

      // Ensure the users table exists
      await dbClient.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          google_id TEXT NOT NULL
        );
      `);
      console.log("Users table is ready!");

      return dbClient;
    } catch (error) {
      console.error("Database connection failed, retrying in 5s...", error);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("Failed to connect to the database after multiple attempts.");
}
