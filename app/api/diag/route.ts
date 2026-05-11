import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isContainer = fs.existsSync('/app/data');
  const dbPath = isContainer ? '/app/data/gbms.db' : path.join(process.cwd(), 'gbms.db');
  const jsonPath = dbPath.replace('.db', '.json');
  
  const stats = {
    environment: {
      isContainer,
      dbPath,
      jsonPath,
      nodeEnv: process.env.NODE_ENV,
      cwd: process.cwd(),
      now: new Date().toISOString()
    },
    storage: {
      dbExists: fs.existsSync(dbPath),
      dbSize: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0,
      jsonExists: fs.existsSync(jsonPath),
      jsonSize: fs.existsSync(jsonPath) ? fs.statSync(jsonPath).size : 0,
      canWriteData: false
    },
    dbConnectivity: {
      ok: false,
      records: null as any,
      error: null as string | null
    }
  };

  try {
    const testFile = path.join(path.dirname(dbPath), '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    stats.storage.canWriteData = true;
  } catch (e) {
    stats.storage.canWriteData = false;
  }

  try {
    const db = await getDb();
    const txCount = await db.all('SELECT count(*) as count FROM transactions').catch(() => []);
    stats.dbConnectivity = {
      ok: true,
      records: txCount,
      error: null
    };
  } catch (e: any) {
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
