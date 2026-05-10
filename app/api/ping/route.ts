import { NextResponse } from 'next/server';
import { corsHeaders } from '@/app/lib/cors';

export async function GET() {
  return new NextResponse(JSON.stringify({ status: "ALIVE", timestamp: new Date().toISOString() }), {
    status: 200,
    headers: corsHeaders,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
