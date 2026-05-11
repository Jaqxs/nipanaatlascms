import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const db = await getDb();
    const invoices = await db.all('SELECT * FROM invoices ORDER BY id DESC');
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
    const no = body.no || `INV-${Date.now()}`;
    const issued = body.issued || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit' });

    await db.run(
      `INSERT INTO invoices (id, no, customer, issued, due, amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, no, body.customer, issued, body.due, body.amount, body.status || 'Sent']
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("[API ERROR] Failed to create invoice:", error.message || error);
    return NextResponse.json({ error: 'Failed to create invoice', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, action } = await request.json();
    const db = await getDb();

    if (action === 'delete') {
      await db.run('DELETE FROM invoices WHERE id = ?', [id]);
    } else {
      const status = action === 'pay' ? 'paid' : action === 'void' ? 'void' : 'pending';
      await db.run('UPDATE invoices SET status = ? WHERE id = ?', [status, id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}
