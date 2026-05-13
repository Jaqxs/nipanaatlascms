import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isContainer = fs.existsSync('/app/data');
  const dbPath = isContainer ? '/app/data/gbms.db' : path.join(process.cwd(), 'gbms.db');
  const jsonPath = dbPath.replace('.db', '.json');
  
  const stats: any = {
    time: new Date().toISOString(),
    environment: {
      isContainer,
      dbPath,
      jsonPath,
      nodeEnv: process.env.NODE_ENV,
      cwd: process.cwd()
    },
    storage: {
      dbExists: fs.existsSync(dbPath),
      jsonExists: fs.existsSync(jsonPath),
      canWrite: false
    },
    connectivity: {
      sqlite: false,
      cloud: false,
      hub: "pending",
      error: null as string | null
    }
  };

  // 1. Test Writability
  try {
    const testFile = path.join(path.dirname(dbPath), '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    stats.storage.canWrite = true;
  } catch (e: any) {
    stats.storage.canWrite = false;
    stats.connectivity.error = `Write failed: ${e.message}`;
  }

  // 2. Test SQLite / Internal Logic
  try {
    const db = await getDb();
    const txCount = await db.all('SELECT count(*) as count FROM transactions').catch(() => []);
    stats.connectivity.sqlite = true;
    stats.dbRecords = txCount;
  } catch (e: any) {
    stats.connectivity.sqlite = false;
    stats.connectivity.error = stats.connectivity.error || `DB failed: ${e.message}`;
  }

  // 4. Test Hub Connectivity
  try {
    const hubRes = await fetch((process.env.NEXT_PUBLIC_API_URL || 'https://system.nipanaatlas.co.tz') + '/api/storage', { method: 'GET', signal: AbortSignal.timeout(2000) });
    stats.connectivity.hub = hubRes.ok ? "connected" : `error (${hubRes.status})`;
  } catch (e: any) {
    stats.connectivity.hub = "unreachable";
  }

  return NextResponse.json(stats);
}
