import fs from 'fs';
import path from 'path';

// COMPLETELY REMOVED SQLITE IMPORTS TO PREVENT CRASHES
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

function ensureDb() {
  const dataDir = path.dirname(DB_FILE);
  if (!fs.existsSync(dataDir)) {
    try { fs.mkdirSync(dataDir, { recursive: true }); } catch (e) {}
  }
  if (!fs.existsSync(DB_FILE)) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(DEFAULT_DB));
    } catch (e) {
      console.error("FATAL: Could not write DB file", e);
    }
  }
}

export async function getDb() {
  ensureDb();
  
  const read = () => {
    try {
      if (!fs.existsSync(DB_FILE)) return DEFAULT_DB;
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as DatabaseSchema;
    } catch (e) { return DEFAULT_DB; }
  };

  const write = (data: DatabaseSchema) => {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
      return true;
    } catch (e) { return false; }
  };

  return {
    all: async (sql: string, params: any[] = []) => {
      const db = read();
      if (sql.includes('FROM transactions')) return db.transactions;
      if (sql.includes('FROM inventory')) return db.inventory;
      if (sql.includes('FROM sites')) return db.sites;
      if (sql.includes('FROM contacts')) return db.contacts;
      if (sql.includes('FROM invoices')) return db.invoices;
      return [];
    },
    get: async (sql: string, params: any[] = []) => {
      const db = read();
      const id = params[0];
      if (sql.includes('FROM transactions')) return db.transactions.find(t => t.id === id);
      if (sql.includes('FROM sites')) return db.sites.find(s => s.id === id);
      return null;
    },
    run: async (sql: string, params: any[] = []) => {
      const db = read();
      if (sql.startsWith('INSERT INTO transactions')) {
        const [id, ref, date, type, party, amount, status, description, submittedBy] = params;
        db.transactions.push({ id, ref, date, type, party, amount, status, description, submittedBy, createdAt: new Date().toISOString() });
      } else if (sql.startsWith('INSERT INTO sites')) {
        const [id, name, location, manager, type, status, productionRate] = params;
        db.sites.push({ id, name, location, manager, type, status, productionRate, createdAt: new Date().toISOString() });
      } else if (sql.startsWith('DELETE FROM sites')) {
        const id = params[0];
        db.sites = db.sites.filter(s => s.id !== id);
      } else if (sql.startsWith('UPDATE sites')) {
        const [name, location, manager, type, status, id] = params;
        const site = db.sites.find(s => s.id === id);
        if (site) Object.assign(site, { name, location, manager, type, status });
      }
      write(db);
      return { lastID: params[0] };
    },
    exec: async (sql: string) => {
      ensureDb();
    }
  };
}
