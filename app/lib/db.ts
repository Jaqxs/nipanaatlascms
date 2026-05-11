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
        console.log("[DATABASE] Hydrating from backend mirror:", CLOUD_URL);
        const res = await fetch(CLOUD_URL);
        if (res.ok) {
          const cloudData = await res.json();
          if (cloudData && typeof cloudData === 'object') {
            // Smart merge: Only overwrite if cloud has actual data
            Object.keys(cloudData).forEach(key => {
              if (Array.isArray(cloudData[key]) && cloudData[key].length > 0) {
                MEMORY_DB[key] = cloudData[key];
              }
            });
            console.log("[DATABASE] Cloud data synchronized (Smart Merge).");
          }
        }
      } catch (e: any) {
        console.warn("[DATABASE] Backend connection failed. Trying local storage fallbacks.");
      }

      // LOCAL JSON HYDRATION (Critical fallback for serverless/ephemeral)
      const JSON_PATH = DB_PATH.replace('.db', '.json');
      try {
        if (fs.existsSync(JSON_PATH)) {
          const data = fs.readFileSync(JSON_PATH, 'utf8');
          const localData = JSON.parse(data);
          // Smart merge for local JSON too
          Object.keys(localData).forEach(key => {
            if (Array.isArray(localData[key]) && localData[key].length > 0) {
              if (!MEMORY_DB[key] || MEMORY_DB[key].length === 0) {
                MEMORY_DB[key] = localData[key];
              }
            }
          });
          console.log("[DATABASE] Persistent JSON data merged.");
        }
      } catch (e) {
        console.warn("[DATABASE] JSON load failed:", e);
      }
    }
    INITIALIZED = true;
  }

  const JSON_PATH = DB_PATH.replace('.db', '.json');

  const saveToJson = () => {
    try {
      const dataToSave = JSON.stringify(MEMORY_DB, null, 2);
      fs.writeFileSync(JSON_PATH, dataToSave);
      console.log("[DATABASE] Local JSON snapshot saved.");
    } catch (e) {
      console.warn("[DATABASE] JSON save failed:", e);
    }
  };

  const syncToCloud = async () => {
    saveToJson(); // Always commit to local disk first for immediate persistence
    try {
      console.log("[DATABASE] Syncing to cloud mirror...");
      await fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MEMORY_DB)
      });
      console.log("[DATABASE] Cloud mirror updated.");
    } catch (e: any) {
      console.warn("[DATABASE] Cloud sync skipped (offline):", e.message);
    }
  };

  // IF SQLITE IS WORKING, RETURN REAL DB WRAPPER
  if (USE_SQLITE) {
    try {
      if (!sqlite3) sqlite3 = require('sqlite3');
      if (!open) open = require('sqlite').open;
      const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
      return db;
    } catch (e) {
      console.warn("[DATABASE] SQLite wrapper failed late. Switching to JSON/Memory.");
      USE_SQLITE = false;
    }
  }

  // FALLBACK: CLOUD/JSON MIRROR EMULATOR
  const mockDb = {
    run: async (q: string, params: any[] = []) => {
      const sql = q.toLowerCase();
      const id = params[0] || Date.now().toString();
      
      if (sql.includes('insert into transactions')) MEMORY_DB.transactions.push(params);
      if (sql.includes('insert into sites')) MEMORY_DB.sites.push(params);
      if (sql.includes('insert into invoices')) MEMORY_DB.invoices.push(params);
      if (sql.includes('insert into quotations')) MEMORY_DB.quotations.push(params);
      if (sql.includes('insert into contacts')) MEMORY_DB.contacts.push(params);
      if (sql.includes('insert into inventory')) MEMORY_DB.inventory.push(params);
      
      if (sql.includes('delete from transactions')) {
        MEMORY_DB.transactions = MEMORY_DB.transactions.filter((t: any) => t[1] !== params[0]);
      }
      if (sql.includes('delete from sites')) {
        MEMORY_DB.sites = MEMORY_DB.sites.filter((s: any) => s[0] !== params[0]);
      }
      if (sql.includes('delete from contacts')) {
        MEMORY_DB.contacts = MEMORY_DB.contacts.filter((c: any) => c[0] !== params[0]);
      }
      
      if (sql.includes('update transactions set status')) {
        const tx = MEMORY_DB.transactions.find((t: any) => t[1] === params[1]);
        if (tx) tx[6] = params[0];
      }
      if (sql.includes('update contacts set status')) {
        const c = MEMORY_DB.contacts.find((c: any) => c[0] === params[1]);
        if (c) c[5] = params[0];
      }
      
      // IMMEDIATE PERSISTENCE: Save to JSON and Cloud on every write
      await syncToCloud();
      
      return { lastID: id };
    },
    all: async (sql: string) => {
      const q = sql.toLowerCase();
      
      const mapData = (data: any[], mapper: (d: any) => any) => {
        return data.map(d => {
          if (Array.isArray(d)) return mapper(d);
          // If it's already an object, return it as is but ensure property names match expected
          return { ...d };
        });
      };

      if (q.includes('from transactions')) return mapData(MEMORY_DB.transactions, (d: any) => ({
        id: d[0], ref: d[1], date: d[2], type: d[3], party: d[4], amount: d[5], status: d[6], description: d[7], submittedBy: d[8]
      }));
      if (q.includes('from sites')) return mapData(MEMORY_DB.sites, (d: any) => ({
        id: d[0], name: d[1], location: d[2], manager: d[3], type: d[4], status: d[5], productionRate: d[6]
      }));
      if (q.includes('from invoices')) return mapData(MEMORY_DB.invoices, (d: any) => ({
        id: d[0], no: d[1], customer: d[2], issued: d[3], due: d[4], amount: d[5], status: d[6]
      }));
      if (q.includes('from quotations')) return mapData(MEMORY_DB.quotations, (d: any) => ({
        id: d[0], no: d[1], customer: d[2], expires: d[3], amount: d[4], status: d[5], createdAt: d[6]
      }));
      if (q.includes('from inventory')) return mapData(MEMORY_DB.inventory, (d: any) => ({
        id: d[0], batch: d[1], weight: d[2], karat: d[3], fine: d[4], source: d[5], location: d[6], status: d[7], value: d[8]
      }));
      if (q.includes('from contacts')) return mapData(MEMORY_DB.contacts, (d: any) => ({
        id: d[0], name: d[1], email: d[2], phone: d[3], location: d[4], status: d[5], type: d[6], joined: d[7], totalPurchases: d[8], outstanding: d[9], lastTx: d[10], totalSupplied_g: d[11], totalPaid: d[12]
      }));
      return [];
    },
    get: async (sql: string, params: any[]) => {
      const results = await mockDb.all(sql);
      return results.find((r: any) => r.id === params[0] || r.ref === params[0] || r.no === params[0]) || null;
    },
    exec: async (sql: string) => {
       // Mock exec for initialization
       return true;
    }
  };

  return mockDb;
}



