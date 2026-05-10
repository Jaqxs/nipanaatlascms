import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import fs from 'fs';

export async function GET() {
  const reports: any = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    storage: {}
  };

  try {
    // 1. Check Filesystem
    reports.storage.dataFolder = fs.existsSync('/app/data') ? 'EXISTS' : 'MISSING';
    try {
      fs.writeFileSync('/app/data/diag_test.txt', 'OK');
      reports.storage.writeTest = 'SUCCESS';
    } catch (e: any) {
      reports.storage.writeTest = 'FAILED: ' + e.message;
    }

    // 2. Check Database
    const db = await getDb();
    reports.database = { type: (db as any).exec ? 'SQLite' : 'Cloud Mirror' };
    
    // 3. Test Query
    try {
      const txs = await db.all('SELECT * FROM transactions LIMIT 1');
      reports.database.queryTest = 'SUCCESS';
      reports.database.recordCount = txs.length;
    } catch (e: any) {
      reports.database.queryTest = 'FAILED: ' + e.message;
    }

    // 4. Check Cloud Connectivity
    try {
      const cloudRes = await fetch('https://api.npoint.io/6f7e8d9c0b1a2b3c4d5e');
      reports.cloud = { status: cloudRes.status, ok: cloudRes.ok };
    } catch (e: any) {
      reports.cloud = { status: 'ERROR', message: e.message };
    }

  } catch (e: any) {
    reports.error = e.message;
  }

  return NextResponse.json(reports);
}
