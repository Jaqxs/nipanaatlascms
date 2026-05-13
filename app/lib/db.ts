import { Client } from 'pg';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

let pgClient: Client | null = null;
let sqliteDb: Database | null = null;
let MODE: 'postgres' | 'sqlite' = 'sqlite';

const PG_URL = process.env.DATABASE_URL || 'postgresql://postgres:Jackson@2024@nipanacms-database-depxzd:5432/nipanacms';

export async function getDb() {
  // 1. Try to connect to PostgreSQL if not already connected
  if (!pgClient && !sqliteDb) {
    try {
      console.log("[DATABASE] Attempting PostgreSQL connection...");
      const client = new Client({ 
        connectionString: PG_URL,
        connectionTimeoutMillis: 3000, 
      });
      await client.connect();
      pgClient = client;
      MODE = 'postgres';
      console.log("[DATABASE] Hub Connected (PostgreSQL)");
    } catch (e: any) {
      console.warn("[DATABASE] Hub unreachable, falling back to local SQLite:", e.message);
      MODE = 'sqlite';
    }
  }

  // 2. Initialize SQLite if in SQLite mode
  if (MODE === 'sqlite' && !sqliteDb) {
    const isContainer = fs.existsSync('/app/data');
    const dbPath = isContainer ? '/app/data/gbms.db' : path.join(process.cwd(), 'gbms.db');
    
    // Ensure data directory exists
    if (isContainer && !fs.existsSync('/app/data')) {
      fs.mkdirSync('/app/data', { recursive: true });
    }

    sqliteDb = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log("[DATABASE] Local Persistence Active (SQLite) at", dbPath);
  }

  // 3. Setup Tables (Both)
  const schema = `
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
  `;

  if (MODE === 'postgres' && pgClient) {
    await pgClient.query(schema);
  } else if (sqliteDb) {
    await sqliteDb.exec(schema);
  }

  return {
    mode: MODE,
    all: async (sql: string, params: any = []) => {
      if (MODE === 'postgres' && pgClient) {
        let i = 1;
        const pgSql = sql.replace(/\?/g, () => `$${i++}`);
        const res = await pgClient.query(pgSql, Array.isArray(params) ? params : [params]);
        return res.rows;
      }
      return sqliteDb ? await sqliteDb.all(sql, params) : [];
    },
    get: async (sql: string, params: any = []) => {
      if (MODE === 'postgres' && pgClient) {
        let i = 1;
        const pgSql = sql.replace(/\?/g, () => `$${i++}`);
        const res = await pgClient.query(pgSql, Array.isArray(params) ? params : [params]);
        return res.rows[0] || null;
      }
      return sqliteDb ? await sqliteDb.get(sql, params) : null;
    },
    run: async (sql: string, params: any = []) => {
      if (MODE === 'postgres' && pgClient) {
        let i = 1;
        let pgSql = sql.replace(/INSERT OR REPLACE/gi, "INSERT");
        if (pgSql.toLowerCase().includes("settings")) {
           pgSql += " ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value";
        }
        pgSql = pgSql.replace(/\?/g, () => `$${i++}`);
        await pgClient.query(pgSql, Array.isArray(params) ? params : [params]);
        return { lastID: Date.now() };
      }
      return sqliteDb ? await sqliteDb.run(sql, params) : { lastID: null };
    },
    exec: async (sql: string) => {
      if (MODE === 'postgres' && pgClient) {
        await pgClient.query(sql);
        return true;
      }
      if (sqliteDb) await sqliteDb.exec(sql);
      return true;
    }
  };
}
