import fs from 'fs';
import path from 'path';
import os from 'os';

// THE PATHFINDER: Hunter of writable folders
let SUCCESSFUL_PATH: string | null = null;

const POSSIBLE_PATHS = [
  '/app/data/gbms.json',
  path.join(process.cwd(), 'data/gbms.json'),
  path.join(os.tmpdir(), 'gbms.json'),
  path.join(os.homedir(), 'gbms.json'),
  '/var/tmp/gbms.json'
];

interface DatabaseSchema {
  transactions: any[];
  sites: any[];
  inventory: any[];
}

const DEFAULT_DB: DatabaseSchema = {
  transactions: [],
  sites: [],
  inventory: []
};

export async function getDb() {
  if (!SUCCESSFUL_PATH) {
    for (const p of POSSIBLE_PATHS) {
      try {
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(p, JSON.stringify(DEFAULT_DB));
        SUCCESSFUL_PATH = p;
        console.log(`[PATHFINDER] Found Safe Haven: ${p}`);
        break;
      } catch (e) {
        console.warn(`[PATHFINDER] Folder ${p} is locked. Hunting next...`);
      }
    }
  }

  const dbPath = SUCCESSFUL_PATH || POSSIBLE_PATHS[2]; // Fallback to tmp

  return {
    run: async (sql: string, params: any[]) => {
      try {
        const current = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        if (sql.includes('INSERT INTO transactions')) {
          current.transactions.push(params);
        } else if (sql.includes('INSERT INTO sites')) {
          current.sites.push(params);
        }
        fs.writeFileSync(dbPath, JSON.stringify(current, null, 2));
        return { lastID: params[0] };
      } catch (e: any) {
        throw new Error(`Pathfinder Error at ${dbPath}: ${e.message}`);
      }
    },
    all: async (sql: string) => {
      try {
        const current = JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
        if (sql.includes('FROM transactions')) return current.transactions.map((d: any) => ({
          id: d[0], ref: d[1], date: d[2], type: d[3], party: d[4], amount: d[5], status: d[6], description: d[7]
        }));
        if (sql.includes('FROM sites')) return current.sites.map((d: any) => ({
          id: d[0], name: d[1], location: d[2], manager: d[3], type: d[4], status: d[5], productionRate: d[6]
        }));
        return [];
      } catch (e) { return []; }
    },
    get: async () => null,
    path: dbPath
  };
}
