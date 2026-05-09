import fs from 'fs';
import path from 'path';

// THE STONE-AGE ENGINE: No libraries. No drivers. Just pure text.
const DB_FILE = '/app/data/gbms_ledger.txt';

export async function getDb() {
  const ensure = () => {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) try { fs.mkdirSync(dir, { recursive: true }); } catch(e) {}
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, '');
  };

  return {
    run: async (sql: string, params: any[]) => {
      ensure();
      const entry = { timestamp: new Date().toISOString(), action: 'INSERT', data: params };
      fs.appendFileSync(DB_FILE, JSON.stringify(entry) + '\n');
      console.log("[STONE-AGE] Entry Appended");
      return { lastID: params[0] };
    },
    all: async (sql: string) => {
      ensure();
      const lines = fs.readFileSync(DB_FILE, 'utf-8').split('\n').filter(Boolean);
      const data = lines.map(l => JSON.parse(l).data);
      // Map basic arrays back to expected objects
      if (sql.includes('transactions')) {
        return data.filter(d => d.length > 5).map(d => ({
          id: d[0], ref: d[1], date: d[2], type: d[3], party: d[4], amount: d[5], status: d[6], description: d[7]
        }));
      }
      return [];
    },
    get: async () => null
  };
}
