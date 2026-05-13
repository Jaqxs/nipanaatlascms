import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import fs from 'fs';
import path from 'path';

let sqliteDb: Database | null = null;

export async function getDb() {
  if (!sqliteDb) {
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
    console.log("[DATABASE] Local Production Database Active at", dbPath);

    // Initialize Tables
    await sqliteDb.exec(`
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
  }

  return {
    mode: 'sqlite',
    all: (sql: string, params: any = []) => sqliteDb!.all(sql, params),
    get: (sql: string, params: any = []) => sqliteDb!.get(sql, params),
    run: (sql: string, params: any = []) => sqliteDb!.run(sql, params),
    exec: (sql: string) => sqliteDb!.exec(sql)
  };
}
