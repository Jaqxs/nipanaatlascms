import sqlite3_lib from 'sqlite3';
import { open as open_db } from 'sqlite';
import fs from 'fs';
import path from 'path';

let sqlite3: any = sqlite3_lib;
let open: any = open_db;

let INITIALIZED = false;
let USE_SQLITE = true;
let USE_POSTGRES = false;

// Shared In-Memory Mirror
const MEMORY_DB: any = {
  transactions: [],
  sites: [],
  inventory: [],
  invoices: [],
  quotations: [],
  contacts: [],
  settings: {}
};

const DB_PATH = process.env.NODE_ENV === 'production' 
  ? '/app/data/gbms.db' 
  : path.join(process.cwd(), 'data', 'gbms.db');

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backend.nipanaatlas.co.tz';
const CLOUD_URL = API_BASE_URL + '/api/storage'; 
const PG_URL = process.env.DATABASE_URL;

export async function getDb() {
  // 0. POSTGRES PRIORITY (Production Grade)
  if (PG_URL) {
    try {
      const { Client } = require('pg');
      const client = new Client({ connectionString: PG_URL });
      await client.connect();
      
      // Shim Postgres to look like SQLite for the rest of the app
      return {
        all: async (sql: string, params: any[] = []) => {
          // Convert ? to $n for Postgres
          let i = 1;
          const pgSql = sql.replace(/\?/g, () => `$${i++}`);
          const res = await client.query(pgSql, params);
          return res.rows;
        },
        get: async (sql: string, params: any[] = []) => {
          let i = 1;
          const pgSql = sql.replace(/\?/g, () => `$${i++}`);
          const res = await client.query(pgSql, params);
          return res.rows[0] || null;
        },
        run: async (sql: string, params: any[] = []) => {
          let i = 1;
          const pgSql = sql.replace(/\?/g, () => `$${i++}`);
          const res = await client.query(pgSql, params);
          return { lastID: res.oid || Date.now() };
        },
        exec: async (sql: string) => {
          await client.query(sql);
          return true;
        }
      };
    } catch (e) {
      console.error("[DATABASE] Postgres Connection Failed. Falling back...", e);
    }
  }

  // 1. ATTEMPT SQLITE INITIALIZATION
  if (!INITIALIZED) {
    try {
      if (!sqlite3) sqlite3 = require('sqlite3');
      if (!open) open = require('sqlite').open;

      let db = null;
      try {
        db = await open({ filename: DB_PATH, driver: sqlite3.Database });
      } catch (e1: any) {
        console.warn(`[DATABASE] Tier 1 Fail (${DB_PATH}):`, e1.message);
        try {
          const altPath = path.join(process.cwd(), 'data', 'gbms.db');
          db = await open({ filename: altPath, driver: sqlite3.Database });
        } catch (e2: any) {
          console.warn(`[DATABASE] Tier 2 Fail:`, e2.message);
          try {
            const tmpPath = '/tmp/gbms.db';
            db = await open({ filename: tmpPath, driver: sqlite3.Database });
          } catch (e3: any) {
            USE_SQLITE = false;
          }
        }
      }
        
      if (db) {
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
      }
    } catch (e: any) {
      console.warn("[DATABASE] Local SQLite engine unavailable. Using Memory Mirror.");
      USE_SQLITE = false;
    }

    // 2. HYDRATION / CLOUD CHECK
    if (process.env.NODE_ENV === 'production' || !USE_SQLITE) {
      try {
        console.log("[DATABASE] Hydrating from backend mirror:", CLOUD_URL);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); 

        const res = await fetch(CLOUD_URL, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (res.ok) {
          const data = await res.json();
          Object.assign(MEMORY_DB, data);
          console.log("[DATABASE] SUCCESS: Cloud data hydration successful from " + CLOUD_URL);
        } else {
          console.warn("[DATABASE] FAIL: Cloud server returned " + res.status);
        }
      } catch (e: any) {
        console.warn("[DATABASE] ERROR: Cloud hydration failed (" + e.message + "). This usually means the backend URL is unreachable.");
      }
      
      const JSON_PATH = DB_PATH.replace('.db', '.json');
      try {
        if (fs.existsSync(JSON_PATH)) {
          const data = fs.readFileSync(JSON_PATH, 'utf8');
          const localData = JSON.parse(data);
          Object.assign(MEMORY_DB, localData);
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
    } catch (e) {
      console.warn("[DATABASE] JSON save failed:", e);
    }
  };

  const syncToCloud = async () => {
    saveToJson();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      await fetch(CLOUD_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(MEMORY_DB),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (e: any) {
      console.warn("[DATABASE] Cloud sync skipped:", e.message);
    }
  };

  if (USE_SQLITE) {
    try {
      if (!sqlite3) sqlite3 = require('sqlite3');
      if (!open) open = require('sqlite').open;
      return await open({ filename: DB_PATH, driver: sqlite3.Database });
    } catch (e) {
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
      
      await syncToCloud();
      return { lastID: id };
    },
    all: async (sql: string) => {
      const q = sql.toLowerCase();
      const mapData = (data: any[], mapper: (d: any) => any) => {
        return data.map(d => Array.isArray(d) ? mapper(d) : { ...d });
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
      if (q.includes('from inventory')) return mapData(MEMORY_DB.inventory, (d: any) => ({
        id: d[0], batch: d[1], weight: d[2], karat: d[3], fine: d[4], source: d[5], location: d[6], status: d[7], value: d[8]
      }));
      return [];
    },
    get: async (sql: string, params: any[]) => {
      const results = await mockDb.all(sql);
      return results.find((r: any) => r.id === params[0] || r.ref === params[0] || r.no === params[0]) || null;
    },
    exec: async (sql: string) => true
  };

  return mockDb;
}
