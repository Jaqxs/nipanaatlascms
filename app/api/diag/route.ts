import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isContainer = fs.existsSync('/app/data');
  const dbPath = isContainer ? '/app/data/gbms.db' : path.join(process.cwd(), 'gbms.db');
  const jsonPath = dbPath.replace('.db', '.json');
  
  let sqliteOk = false;
  let jsonOk = false;
  let cloudOk = false;
  let error = null;

  try {
    const db = await getDb();
    sqliteOk = true;
    
    // Test write
    await db.run('CREATE TABLE IF NOT EXISTS diag (id TEXT PRIMARY KEY, val TEXT)');
    await db.run('INSERT OR REPLACE INTO diag (id, val) VALUES (?, ?)', ['test', new Date().toISOString()]);
  } catch (e: any) {
    error = e.message;
  }

  try {
    fs.writeFileSync(jsonPath + '.tmp', 'test');
    fs.unlinkSync(jsonPath + '.tmp');
    jsonOk = true;
  } catch (e) {}

  try {
    const res = await fetch('https://backend.nipanaatlas.co.tz/api/storage', { method: 'HEAD' });
    cloudOk = res.ok;
  } catch (e) {}

  return NextResponse.json({
    diagnostics: {
      platform: {
        is_container: isContainer,
        cwd: process.cwd(),
        node_env: process.env.NODE_ENV
      },
      storage: {
        db_path: dbPath,
        json_path: jsonPath,
        sqlite_initialized: sqliteOk,
        disk_writable: jsonOk,
        cloud_reachable: cloudOk
      },
      error: error
    }
  });
}
