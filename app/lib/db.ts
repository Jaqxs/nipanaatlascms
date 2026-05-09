import fs from 'fs';
import path from 'path';

// THE GHOST DATABASE: Primary store in RAM, Background sync to Disk
const DB_FILE = '/app/data/db.json';

interface DatabaseSchema {
  transactions: any[];
  inventory: any[];
  sites: any[];
  contacts: any[];
  invoices: any[];
  quotations: any[];
}

const DEFAULT_DB: DatabaseSchema = {
  transactions: [],
  inventory: [],
  sites: [],
  contacts: [],
  invoices: [],
  quotations: []
};

// Global variable survives across API calls in the same process
let GHOST_MEMORY: DatabaseSchema | null = null;

function loadFromDisk(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error("[DB] Disk read failed, using default", e);
  }
  return { ...DEFAULT_DB };
}

function saveToDisk(data: DatabaseSchema) {
  try {
    const dataDir = path.dirname(DB_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    console.log("[DB] Disk Sync: SUCCESS");
  } catch (e) {
    console.error("[DB] Disk Sync: FAILED (Permission Issue?)", e);
  }
}

export async function getDb() {
  if (!GHOST_MEMORY) {
    GHOST_MEMORY = loadFromDisk();
    console.log("[DB] Ghost Engine Initialized");
  }
  
  return {
    all: async (sql: string) => {
      if (!GHOST_MEMORY) return [];
      if (sql.includes('FROM transactions')) return GHOST_MEMORY.transactions;
      if (sql.includes('FROM sites')) return GHOST_MEMORY.sites;
      return [];
    },
    run: async (sql: string, params: any[]) => {
      if (!GHOST_MEMORY) GHOST_MEMORY = loadFromDisk();
      
      if (sql.startsWith('INSERT INTO transactions')) {
        const [id, ref, date, type, party, amount, status, description, submittedBy] = params;
        GHOST_MEMORY.transactions.push({ id, ref, date, type, party, amount, status, description, submittedBy, createdAt: new Date().toISOString() });
      } else if (sql.startsWith('INSERT INTO sites')) {
        const [id, name, location, manager, type, status, productionRate] = params;
        GHOST_MEMORY.sites.push({ id, name, location, manager, type, status, productionRate, createdAt: new Date().toISOString() });
      }
      
      // FIRE AND FORGET: Save to memory instantly, sync to disk in background
      saveToDisk(GHOST_MEMORY);
      return { lastID: params[0] };
    },
    get: async (sql: string, params: any[]) => {
      if (!GHOST_MEMORY) return null;
      const id = params[0];
      if (sql.includes('FROM transactions')) return GHOST_MEMORY.transactions.find(t => t.id === id);
      return null;
    }
  };
}
