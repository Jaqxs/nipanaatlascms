import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import { prisma } from '@/app/lib/prisma';
import fs from 'fs';

export const dynamic = 'force-dynamic';

export async function GET() {
  const reports: any = {
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV,
    database_url_configured: !!process.env.DATABASE_URL,
    storage: {}
  };

  try {
    // 1. Check Filesystem
    reports.storage.dataFolder = fs.existsSync('/app/data') ? 'EXISTS' : 'MISSING';
    
    // 2. Check Prisma Client
    try {
      reports.prisma = {
        client_version: '5.16.1',
        connection_test: 'PENDING'
      };
      await prisma.$connect();
      reports.prisma.connection_test = 'SUCCESS';
    } catch (e: any) {
      reports.prisma.connection_test = 'FAILED';
      reports.prisma.connection_error = e.message;
      reports.prisma.error_code = e.code;
    }

    // 3. Check Database Tables
    const db = await getDb();
    reports.database = { mode: db.mode };
    
    const tables = ['transactions', 'inventory', 'contacts', 'sites', 'settings'];
    reports.database.tables = {};

    for (const table of tables) {
      try {
        const count: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) FROM "${table}"`);
        reports.database.tables[table] = { status: 'EXISTS', count: Number(count[0]?.count || 0) };
      } catch (e: any) {
        reports.database.tables[table] = { status: 'MISSING or ERROR', error: e.message };
      }
    }

    // 4. Check Cloud Connectivity
    try {
      const cloudRes = await fetch('https://api.npoint.io/6f7e8d9c0b1a2b3c4d5e');
      reports.cloud = { status: cloudRes.status, ok: cloudRes.ok };
    } catch (e: any) {
      reports.cloud = { status: 'ERROR', message: e.message };
    }

    // 5. Check Connection String (Redacted)
    const dbUrl = process.env.DATABASE_URL || '';
    reports.database_config = {
      configured: !!dbUrl,
      host: dbUrl.split('@')[1]?.split(':')[0] || 'UNKNOWN',
      port: dbUrl.split(':')[3]?.split('/')[0] || 'UNKNOWN',
      protocol: dbUrl.split(':')[0] || 'UNKNOWN'
    };

  } catch (e: any) {
    reports.global_error = e.message;
    reports.stack = e.stack;
  }

  return NextResponse.json(reports);
}
