import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

let INITIALIZED = false;
let pgClient: Client | null = null;

// Database Connection String
const PG_URL = process.env.DATABASE_URL || 'postgresql://postgres:Jackson@2024@nipanacms-database-depxzd:5432/nipanacms';

export async function getDb() {
  if (!pgClient) {
    pgClient = new Client({ 
      connectionString: PG_URL,
      connectionTimeoutMillis: 10000,
    });
    
    try {
      await pgClient.connect();
      console.log("[DATABASE] Successfully connected to PostgreSQL.");
      
      // Initialize Tables if missing (Postgres Syntax)
      // Note: Using camelCase in quotes to maintain compatibility with existing SQLite queries
      await pgClient.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY, "ref" TEXT, "date" TEXT, "type" TEXT, "party" TEXT, 
          "amount" DOUBLE PRECISION, "status" TEXT, "description" TEXT, "submittedBy" TEXT
        );
        CREATE TABLE IF NOT EXISTS sites (
          id TEXT PRIMARY KEY, "name" TEXT, "location" TEXT, "manager" TEXT, 
          "type" TEXT, "status" TEXT, "productionRate" DOUBLE PRECISION
        );
        CREATE TABLE IF NOT EXISTS inventory (
          id TEXT PRIMARY KEY, "batch" TEXT, "weight" DOUBLE PRECISION, "karat" TEXT, 
          "fine" DOUBLE PRECISION, "source" TEXT, "location" TEXT, "status" TEXT, "value" DOUBLE PRECISION
        );
        CREATE TABLE IF NOT EXISTS invoices (
          id TEXT PRIMARY KEY, "no" TEXT, "customer" TEXT, "issued" TEXT, 
          "due" TEXT, "amount" DOUBLE PRECISION, "status" TEXT
        );
        CREATE TABLE IF NOT EXISTS quotations (
          id TEXT PRIMARY KEY, "no" TEXT, "customer" TEXT, "expires" TEXT, 
          "amount" DOUBLE PRECISION, "status" TEXT, "createdAt" TEXT
        );
        CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
        CREATE TABLE IF NOT EXISTS contacts (
          id TEXT PRIMARY KEY, "name" TEXT, "email" TEXT, "phone" TEXT, 
          "location" TEXT, "status" TEXT, "type" TEXT, "joined" TEXT, 
          "totalPurchases" DOUBLE PRECISION DEFAULT 0, "outstanding" DOUBLE PRECISION DEFAULT 0,
          "lastTx" TEXT, "totalSupplied_g" DOUBLE PRECISION DEFAULT 0, "totalPaid" DOUBLE PRECISION DEFAULT 0
        );
      `);
      INITIALIZED = true;
    } catch (e: any) {
      console.error("[DATABASE] PostgreSQL Connection Failed:", e.message);
      // Fallback to memory or error out to trigger Safe Mode correctly
      throw e;
    }
  }

  return {
    all: async (sql: string, params: any[] = []) => {
      if (!pgClient) return [];
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const res = await pgClient.query(pgSql, params);
      return res.rows;
    },
    get: async (sql: string, params: any[] = []) => {
      if (!pgClient) return null;
      let i = 1;
      const pgSql = sql.replace(/\?/g, () => `$${i++}`);
      const res = await pgClient.query(pgSql, params);
      return res.rows[0] || null;
    },
    run: async (sql: string, params: any[] = []) => {
      if (!pgClient) return { lastID: null };
      let i = 1;
      let pgSql = sql.replace(/INSERT OR REPLACE/gi, "INSERT");
      if (pgSql.toLowerCase().includes("settings")) {
         pgSql += " ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value";
      }
      pgSql = pgSql.replace(/\?/g, () => `$${i++}`);
      const res = await pgClient.query(pgSql, params);
      return { lastID: Date.now() };
    },
    exec: async (sql: string) => {
      if (!pgClient) return false;
      await pgClient.query(sql);
      return true;
    },
    close: async () => {
      if (pgClient) {
        await pgClient.end();
        pgClient = null;
      }
    }
  };
}
