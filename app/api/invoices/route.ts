import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const db = await getDb();
    const invoices = await db.all('SELECT * FROM invoices ORDER BY due ASC');
    return NextResponse.json(invoices);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    
    const id = crypto.randomUUID();
    const no = body.no || `INV-2026-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    await db.run(
      `INSERT INTO invoices (id, no, customer, due, amount, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, no, body.customer, body.due, body.amount, body.status || 'sent']
    );

    const newInvoice = await db.get('SELECT * FROM invoices WHERE id = ?', id);
    return NextResponse.json(newInvoice);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
