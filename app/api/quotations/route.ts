import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const db = await getDb();
    const quotations = await db.all('SELECT * FROM quotations ORDER BY createdAt DESC');
    return NextResponse.json(quotations);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { customer, expires, amount, status } = body;
    
    const id = crypto.randomUUID();
    const no = `QUO-2026-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    await db.run(
      'INSERT INTO quotations (id, no, customer, expires, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, no, customer, expires || '—', amount, status || 'DRAFT']
    );
    
    return NextResponse.json({ id, no, message: 'Quotation created successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create quotation' }, { status: 500 });
  }
}
