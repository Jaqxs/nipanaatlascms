import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const stats: any = {
    time: new Date().toISOString(),
    status: "PRODUCTION_HUB_ACTIVE",
    connectivity: {
      database: "checking",
      hub: "connected",
      error: null as string | null
    }
  };

  try {
    // Check if we can reach the Postgres database through Prisma
    await prisma.$queryRaw`SELECT 1`;
    stats.connectivity.database = "online";
  } catch (e: any) {
    stats.connectivity.database = "offline";
    stats.connectivity.error = e.message;
  }

  return new NextResponse(JSON.stringify(stats), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}
