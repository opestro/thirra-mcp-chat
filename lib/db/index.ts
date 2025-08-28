import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Initialize the connection pool with CA certificate support
// For Aiven, we need to handle SSL carefully due to certificate chain issues
const sslConfig = {
  rejectUnauthorized: false, // Allow self-signed certificates for now
  // Uncomment below when CA certificate is properly formatted:
  // rejectUnauthorized: process.env.DB_CA ? true : false,
  ca: process.env.DB_CA ? process.env.DB_CA.replace(/\\n/g, '\n') : undefined,
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: sslConfig,
});

const drizzleClient = drizzle({
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: sslConfig,
  },
  schema,
});

// Initialize Drizzle with the connection pool and schema
export const db = drizzleClient;