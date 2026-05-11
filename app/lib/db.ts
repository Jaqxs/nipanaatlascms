import fs from 'fs';
import path from 'path';

// Native modules will be loaded dynamically to avoid crashing the server if binaries are missing
let sqlite3: any;
let open: any;

/**
 * GBMS HYBRID-CLOUD DATABASE ENGINE
 * ---------------------------------
 * Priority 1: Local SQLite (Fast, Real-time)
 * Priority 2: Cloud Mirror (Persistent, Global)
 */

let MEMORY_DB: any = { 
  transactions: [], 
  sites: [], 
  inventory: [], 
  invoices: [],
  quotations: [],
  contacts: [],
  settings: []
};
let INITIALIZED = false;
let USE_SQLITE = false;

// Detect if we are in a container or local
const IS_CONTAINER = fs.existsSync('/app/data');
const DB_PATH = IS_CONTAINER ? '/app/data/gbms.db' : path.join(process.cwd(), 'gbms.db');

// THE CLOUD MIRROR: Official GBMS Backend API (configured via env or fallback)
const CLOUD_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.nipanaatlas.co.tz') + '/api/storage'; 

export async function getDb() {
  // 1. ATTEMPT SQLITE INITIALIZATION
  if (!INITIALIZED) {
    try {
      // DYNAMIC LOAD
      if (!sqlite3) sqlite3 = require('sqlite3');
      if (!open) open = require('sqlite').open;

      if (true) { // Always try SQLite first
        const db = await open({
          filename: DB_PATH,
          driver: sqlite3.Database
        });
        
        // Create tables if missing
        await db.exec(`
          CREATE TABLE IF NOT EXISTS transactions (
            id TEXT PRIMARY KEY, ref TEXT, date TEXT, type TEXT, party TEXT, 
            amount REAL, status TEXT, description TEXT, submittedBy TEXT
          );
          CREATE TABLE IF NOT EXISTS sites (
            id TEXT PRIMARY KEY, name TEXT, location TEXT, manager TEXT, 
            type TEXT, status TEXT, productionRate REAL
          );
          CREATE TABLE IF NOT EXISTS inventory (
            id TEXT PRIMARY KEY, batch TEXT, weight REAL, karat TEXT, 
            fine REAL, source TEXT, location TEXT, status TEXT, value REAL
          );
          CREATE TABLE IF NOT EXISTS invoices (
            id TEXT PRIMARY KEY, no TEXT, customer TEXT, issued TEXT, 
            due TEXT, amount REAL, status TEXT
          );
          CREATE TABLE IF NOT EXISTS quotations (
            id TEXT PRIMARY KEY, no TEXT, customer TEXT, expires TEXT, 
            amount REAL, status TEXT, createdAt TEXT
          );
          CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
          CREATE TABLE IF NOT EXISTS contacts (
            id TEXT PRIMARY KEY, name TEXT, email TEXT, phone TEXT, 
            location TEXT, status TEXT, type TEXT, joined TEXT, 
            totalPurchases REAL DEFAULT 0, outstanding REAL DEFAULT 0,
            lastTx TEXT, totalSupplied_g REAL DEFAULT 0, totalPaid REAL DEFAULT 0
          );
        `);
        
        USE_SQLITE = true;
        console.log("[DATABASE] SQLite connected and ready.");

        // SELF-HEALING: Add missing columns to existing tables
        const tables = await db.all("SELECT name FROM sqlite_master WHERE type='table'");
        const tableNames = tables.map((t: any) => t.name);

        if (tableNames.includes('inventory')) {
          const cols = await db.all("PRAGMA table_info(inventory)");
          const colNames = cols.map((c: any) => c.name);
          if (!colNames.includes('batch')) await db.exec("ALTER TABLE inventory ADD COLUMN batch TEXT");
          if (!colNames.includes('karat')) await db.exec("ALTER TABLE inventory ADD COLUMN karat TEXT");
          if (!colNames.includes('fine')) await db.exec("ALTER TABLE inventory ADD COLUMN fine REAL");
          if (!colNames.includes('source')) await db.exec("ALTER TABLE inventory ADD COLUMN source TEXT");
          if (!colNames.includes('location')) await db.exec("ALTER TABLE inventory ADD COLUMN location TEXT");
          if (!colNames.includes('value')) await db.exec("ALTER TABLE inventory ADD COLUMN value REAL");
        }
        if (tableNames.includes('invoices')) {
          const cols = await db.all("PRAGMA table_info(invoices)");
          const colNames = cols.map((c: any) => c.name);
          if (!colNames.includes('issued')) await db.exec("ALTER TABLE invoices ADD COLUMN issued TEXT");
          if (!colNames.includes('due')) await db.exec("ALTER TABLE invoices ADD COLUMN due TEXT");
        }
      }
    } catch (e: any) {
      console.warn("[DATABASE] Local Database engine unavailable (Binary missing or path inaccessible). Falling back to Cloud Mirror.");
      console.error(" - Cause:", e.message || e);
    }

    // 2. HYDRATION / CLOUD CHECK
    if (process.env.NODE_ENV === 'production' || !USE_SQLITE) {
      try {
        console.log("[DATABASE] Connecting to official backend:", CLOUD_URL);
        const res = await fetch(CLOUD_URL);
        if (res.ok) {
          const cloudData = await res.json();
          if (cloudData && typeof cloudData === 'object') {
            MEMORY_DB = { ...MEMORY_DB, ...cloudData };
            console.log("[DATABASE] Cloud data synchronized.");
          }
        }
      } catch (e: any) {
        console.error("[DATABASE] Backend connection FAILED:");
        console.error(" - URL:", CLOUD_URL);
        console.error(" - Error:", e.message || e);
        if (e.cause) console.error(" - Cause:", e.cause);
        console.warn("[DATABASE] Falling back to local/memory state.");
      }
    }
    INITIALIZED = true;
  }

  const syncToCloud = async () => {
    try {
      await fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MEMORY_DB)
      });
    } catch (e: any) {
      console.warn("[DATABASE] Background Sync failed:", e.message);
    }
  };

  // IF SQLITE IS WORKING, RETURN REAL DB WRAPPER
  if (USE_SQLITE) {
    if (!sqlite3) sqlite3 = require('sqlite3');
    if (!open) open = require('sqlite').open;
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    return db;
  }

  // FALLBACK: CLOUD MIRROR EMULATOR
  const mockDb = {
    run: async (sql: string, params: any[]) => {
      const q = sql.toLowerCase();
      if (q.includes('insert into transactions')) MEMORY_DB.transactions.push(params);
      else if (q.includes('insert into sites')) MEMORY_DB.sites.push(params);
      else if (q.includes('insert into invoices')) MEMORY_DB.invoices.push(params);
      else if (q.includes('insert into quotations')) MEMORY_DB.quotations.push(params);
      else if (q.includes('insert into inventory')) MEMORY_DB.inventory.push(params);
      else if (q.includes('insert into contacts')) MEMORY_DB.contacts.push(params);
      else if (q.includes('update transactions')) {
        const row = MEMORY_DB.transactions.find((t: any) => t[1] === params[1]);
        if (row) row[6] = params[0];
      }
      else if (q.includes('delete from')) {
        const id = params[0];
        if (q.includes('transactions')) MEMORY_DB.transactions = MEMORY_DB.transactions.filter((t: any) => t[1] !== id);
        if (q.includes('sites')) MEMORY_DB.sites = MEMORY_DB.sites.filter((s: any) => s[0] !== id);
      }
      
      await syncToCloud();
      return { lastID: params[0] || Date.now() };
    },
    all: async (sql: string) => {
      const q = sql.toLowerCase();
      if (q.includes('from transactions')) return MEMORY_DB.transactions.map((d: any) => ({
        id: d[0], ref: d[1], date: d[2], type: d[3], party: d[4], amount: d[5], status: d[6], description: d[7], submittedBy: d[8]
      }));
      if (q.includes('from sites')) return MEMORY_DB.sites.map((d: any) => ({
        id: d[0], name: d[1], location: d[2], manager: d[3], type: d[4], status: d[5], productionRate: d[6]
      }));
      if (q.includes('from invoices')) return MEMORY_DB.invoices.map((d: any) => ({
        id: d[0], no: d[1], customer: d[2], issued: d[3], due: d[4], amount: d[5], status: d[6]
      }));
      if (q.includes('from quotations')) return MEMORY_DB.quotations.map((d: any) => ({
        id: d[0], no: d[1], customer: d[2], expires: d[3], amount: d[4], status: d[5], createdAt: d[6]
      }));
      if (q.includes('from inventory')) return MEMORY_DB.inventory.map((d: any) => ({
        id: d[0], batch: d[1], weight: d[2], karat: d[3], fine: d[4], source: d[5], location: d[6], status: d[7], value: d[8]
      }));
      if (q.includes('from contacts')) return MEMORY_DB.contacts || [];
      return [];
    },
    get: async (sql: string, params: any[]) => {
      const results = await mockDb.all(sql);
      return results.find((r: any) => r.id === params[0] || r.ref === params[0] || r.no === params[0]) || null;
    }
  };

  return mockDb;
}



