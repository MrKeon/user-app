export interface DatabaseConfig {
    type: "postgres" | "mongodb" | string;
    hostname: string;
    port: number;
    database: string;
    user: string;
    password: string;
    connectionString?: string; // Optional for databases with URI support
    options?: Record<string, unknown>; // Additional driver-specific options
  }
  