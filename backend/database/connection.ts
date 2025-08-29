import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./config.env" });

// Database configuration
const dbConfig: PoolConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "bby_service_menu",
  user: process.env.DB_USER || "josh",
  password: process.env.DB_PASSWORD || "",
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
};

// Create connection pool
const pool = new Pool(dbConfig);

// Test database connection
pool.on("connect", () => {
  console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("❌ Database connection error:", err);
});

// Function to test connection
export const testConnection = async (): Promise<boolean> => {
  try {
    const client = await pool.connect();
    const result = await client.query("SELECT NOW()");
    client.release();
    console.log("✅ Database connection test successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("❌ Database connection test failed:", error);
    return false;
  }
};

// Function to get a client from the pool
export const getClient = () => pool.connect();

// Function to execute a query
export const query = (text: string, params?: any[]) => pool.query(text, params);

// Function to close the pool (call this when shutting down the app)
export const closePool = () => pool.end();

export default pool;
