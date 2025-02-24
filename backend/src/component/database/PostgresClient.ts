import { Client } from "https://deno.land/x/postgres/mod.ts";
import { BaseDatabaseClient } from "./DatabaseClient.ts";

export class PostgresClient extends BaseDatabaseClient {
  private client!: Client;

  constructor(user: string, password: string, database: string, hostname: string, port: number) {
    super();
    this.config = {
      type: "postgres",
      user,
      password,
      database,
      hostname,
      port
    }
  }

  async connect(): Promise<void> {
    const { user, password, database, hostname, port } = this.config;

    this.client = new Client({ user, password, database, hostname, port });

    try {
      await this.client.connect();
      console.log("Connected to PostgreSQL");
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.client.end();
    console.log("Disconnected from PostgreSQL");
  }

  async query<T>(sqlOrCollection: string, params?: unknown[]): Promise<T[]> {
    this.logQuery(sqlOrCollection, params);
    let result;
    if (!params) {
      result = await this.client.queryObject(sqlOrCollection);
    } else {
      result = await this.client.queryObject(sqlOrCollection, params);
    }
    return result.rows as T[];
  }

  async insert<T>(table: string, data: Record<string, unknown>): Promise<T> {
    const keys = Object.keys(data).join(", ");
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");
    const sql = `INSERT INTO ${table} (${keys}) VALUES (${placeholders}) RETURNING *`;

    const results = await this.query<T>(sql, values);
    return results[0];
  }

  async update<T>(table: string, id: string, data: Record<string, unknown>): Promise<void> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(", ");
    const sql = `UPDATE ${table} SET ${setClause} WHERE id = $${keys.length + 1}`;

    await this.query(sql, [...values, id]);
  }

  async delete(table: string, id: string): Promise<void> {
    const sql = `DELETE FROM ${table} WHERE id = $1`;
    await this.query(sql, [id]);
  }
}
