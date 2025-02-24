import { Database, Document, MongoClient } from "https://deno.land/x/mongo/mod.ts";
import { BaseDatabaseClient } from "./DatabaseClient.ts";
import { DatabaseConfig } from "./DatabaseConfig.ts";

export class MongoDBClient extends BaseDatabaseClient {
  private client!: MongoClient;
  private db!: Database;

  constructor(user: string, password: string, database: string, hostname: string, port: number) {
    super();
    this.config = {
      type: "mongodb",
      user,
      password,
      database,
      hostname,
      port
    }
  }

  async connect(): Promise<void> {

    const uri = this.config.connectionString || `mongodb://${this.config.hostname}:${this.config.port}`;
    this.client = new MongoClient();
    await this.client.connect(uri);

    this.db = this.client.database(this.config.database!);
    console.log(`Connected to MongoDB: ${this.config.database}`);
  }

  async disconnect(): Promise<void> {
    await this.client.close();
    console.log("Disconnected from MongoDB");
  }

  async query<T>(collectionName: string, filter: Record<string, unknown>): Promise<T[]> {
    this.logQuery(`MongoDB Query: ${JSON.stringify(filter)}`);
    return await this.db.collection(collectionName).find(filter).toArray() as T[];
  }

  async insert<T>(collectionName: string, data: Record<string, unknown>): Promise<T> {
    this.logQuery(`Insert: ${JSON.stringify(data)}`);
    const insertedId = await this.db.collection(collectionName).insertOne(data);
    return { ...data, _id: insertedId } as T;
  }

  async update<T>(collectionName: string, id: string, data: Record<string, unknown>): Promise<void> {
    this.logQuery(`Update: ${JSON.stringify(data)}`);
    await this.db.collection(collectionName).updateOne({ _id: id }, { $set: data });
  }

  async delete(collectionName: string, id: string): Promise<void> {
    this.logQuery(`Delete: ${id}`);
    await this.db.collection(collectionName).deleteOne({ _id: id });
  }
}
