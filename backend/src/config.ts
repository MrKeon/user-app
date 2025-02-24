import { config } from "https://deno.land/x/dotenv/mod.ts";

export const ENV = Deno.env.get("NODE_ENV") || "development";
export const PORT = Deno.env.get("PORT") || "8000";
export const DB_USER = Deno.env.get("DB_USER") || "postgres";
export const DB_PASSWORD = Deno.env.get("DB_PASSWORD") || "secret";
export const DB_NAME = Deno.env.get("DB_NAME") || "accounts";
export const DB_HOST = Deno.env.get("DB_HOST") || "localhost";
export const DB_PORT = Number(Deno.env.get("DB_PORT")) || 5432;
export const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
export const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";
export const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI") || "";
export const JWT_SECRET_STRING = Deno.env.get("JWT_SECRET") || "your-secret-key";

const envFileMap: Record<string, string> = {
  development: ".local.env",
  staging: ".staging.env",
  production: ".production.env"
};

const envFile = envFileMap[ENV] || ".env"

config({ path: envFile });

