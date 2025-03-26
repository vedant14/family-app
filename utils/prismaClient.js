import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";

// Safely handle environment variables for client-side
const connectionString = import.meta.env.VITE_DATABASE_URL;

if (!connectionString) {
  throw new Error("Database connection string is not defined");
}

// Configure Neon for edge environments
neonConfig.poolQueryViaFetch = true;

const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);
const prisma = new PrismaClient({ adapter });

export default prisma;
