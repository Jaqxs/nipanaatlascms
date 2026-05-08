import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import crypto from 'crypto';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const db = await getDb();
    
    let query = 'SELECT * FROM transactions ORDER BY id DESC';
    if (limit) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const transactions = await db.all(query);
    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    
    const id = crypto.randomUUID();
    const ref = body.ref || `TX-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    await db.run(
      `INSERT INTO transactions (id, ref, date, type, party, amount, status, description, submittedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, ref, body.date, body.type, body.party, body.amount, body.status || 'pending', body.description, body.submittedBy || 'J. Assey']
    );

    const newTx = await db.get('SELECT * FROM transactions WHERE id = ?', id);
    return NextResponse.json(newTx);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}
