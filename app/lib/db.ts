import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

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
  settings: []
};
let INITIALIZED = false;
let USE_SQLITE = false;

const DB_PATH = '/app/data/gbms.db';
// THE CLOUD MIRROR: Official GBMS Backend API (configured via env or fallback)
const CLOUD_URL = (process.env.NEXT_PUBLIC_API_URL || 'https://backend.nipanatlas.co.tz') + '/api/storage'; 

export async function getDb() {
  // 1. ATTEMPT SQLITE INITIALIZATION
  if (!INITIALIZED) {
    try {
      if (fs.existsSync('/app/data')) {
        const db = await open({
          filename: DB_PATH,
          driver: sqlite3.Database
        });
        
        // Create tables if missing
        await db.exec(`
          CREATE TABLE IF NOT EXISTS transactions (id TEXT, ref TEXT, date TEXT, type TEXT, party TEXT, amount REAL, status TEXT, description TEXT, submittedBy TEXT);
          CREATE TABLE IF NOT EXISTS sites (id TEXT, name TEXT, location TEXT, manager TEXT, type TEXT, status TEXT, productionRate REAL);
          CREATE TABLE IF NOT EXISTS inventory (id TEXT, item TEXT, category TEXT, weight REAL, value REAL, status TEXT);
          CREATE TABLE IF NOT EXISTS invoices (id TEXT, ref TEXT, date TEXT, customer TEXT, amount REAL, status TEXT);
          CREATE TABLE IF NOT EXISTS quotations (id TEXT, no TEXT, customer TEXT, expires TEXT, amount REAL, status TEXT, createdAt TEXT);
          CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);
        `);
        
        USE_SQLITE = true;
        console.log("[DATABASE] SQLite connected and ready.");
      }
    } catch (e) {
      console.warn("[DATABASE] SQLite failed, falling back to Cloud Mirror:", e);
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
      } catch (e) {
        console.error("[DATABASE] Backend connection failed, using local state.");
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
    } catch (e) {}
  };

  // IF SQLITE IS WORKING, RETURN REAL DB WRAPPER
  if (USE_SQLITE) {
    const db = await open({ filename: DB_PATH, driver: sqlite3.Database });
    return db;
  }

  // FALLBACK: CLOUD MIRROR EMULATOR
  return {
    run: async (sql: string, params: any[]) => {
      const q = sql.toLowerCase();
      if (q.includes('insert into transactions')) MEMORY_DB.transactions.push(params);
      else if (q.includes('insert into sites')) MEMORY_DB.sites.push(params);
      else if (q.includes('insert into invoices')) MEMORY_DB.invoices.push(params);
      else if (q.includes('insert into quotations')) MEMORY_DB.quotations.push(params);
      else if (q.includes('insert into inventory')) MEMORY_DB.inventory.push(params);
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
        id: d[0], ref: d[1], date: d[2], customer: d[3], amount: d[4], status: d[5]
      }));
      if (q.includes('from quotations')) return MEMORY_DB.quotations.map((d: any) => ({
        id: d[0], no: d[1], customer: d[2], expires: d[3], amount: d[4], status: d[5], createdAt: d[6]
      }));
      if (q.includes('from inventory')) return MEMORY_DB.inventory || [];
      return [];
    },
    get: async (sql: string, params: any[]) => {
      const results = await (this as any || {}).all?.(sql) || [];
      return results.find((r: any) => r.id === params[0] || r.ref === params[0] || r.no === params[0]) || null;
    }
  };
}



