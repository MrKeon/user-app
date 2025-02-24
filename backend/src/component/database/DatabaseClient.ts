import { DatabaseConfig } from "./DatabaseConfig.ts";

export interface DatabaseClient {
    connect(config: DatabaseConfig): Promise<void>;
    disconnect(): Promise<void>;
    // Overloaded query signatures
    query<T>(sql: string, params?: unknown[]): Promise<T[]>; // SQL query
    query<T>(collectionName: string, filter: Record<string, unknown>): Promise<T[]>; // NoSQL query
    insert<T>(table: string, data: Record<string, unknown>): Promise<T>;
    update<T>(table: string, id: string, data: Record<string, unknown>): Promise<void>;
    delete(table: string, id: string): Promise<void>;
  }
    
export abstract class BaseDatabaseClient implements DatabaseClient {
    protected config!: DatabaseConfig;

    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract query<T>(arg1: string, arg2?: unknown): Promise<T[]>; // Handle both SQL & NoSQL
    abstract insert<T>(table: string, data: Record<string, unknown>): Promise<T>;
    abstract update<T>(table: string, id: string, data: Record<string, unknown>): Promise<void>;
    abstract delete(table: string, id: string): Promise<void>;
  
    protected logQuery(query: string, params?: unknown[]): void {
      console.log(`Executing Query: ${query}`);
      if (params) {
        console.log(`With Params: ${JSON.stringify(params)}`);
      }
    }
  
    protected handleError(error: unknown): void {
      console.error("Database Error:", error);
    }
}