import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getDb } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const isContainer = fs.existsSync('/app/data');
  const dbPath = isContainer ? '/app/data/gbms.db' : path.join(process.cwd(), 'gbms.db');
  
  const stats: any = {
    time: new Date().toISOString(),
    status: "STANDALONE_MODE",
    storage: {
      dbPath,
      exists: fs.existsSync(dbPath),
      canWrite: false
    },
    connectivity: {
      db: "checking",
      error: null as string | null
    }
  };

  try {
    const testFile = path.join(path.dirname(dbPath), '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    stats.storage.canWrite = true;
  } catch (e: any) {
    stats.connectivity.error = `Write permission denied: ${e.message}`;
  }

  try {
    const db = await getDb();
    const txCount = await db.all('SELECT count(*) as count FROM transactions');
    stats.connectivity.db = "connected";
    stats.dbRecords = txCount;
  } catch (e: any) {
    stats.connectivity.db = "error";
    stats.connectivity.error = stats.connectivity.error || `Database error: ${e.message}`;
  }

  return new NextResponse(JSON.stringify(stats), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}
