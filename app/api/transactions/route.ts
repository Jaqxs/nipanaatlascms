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
    console.log(`[API] Creating transaction:`, body);
    const db = await getDb();
    
    const id = crypto.randomUUID();
    const ref = body.ref || `TX-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    await db.run(
      `INSERT INTO transactions (id, ref, date, type, party, amount, status, description, submittedBy)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, ref, body.date, body.type, body.party, body.amount, body.status || 'pending', body.description, body.submittedBy || 'J. Assey']
    );

    const newTx = await db.get('SELECT * FROM transactions WHERE id = ?', id);
    console.log(`[API] Transaction saved:`, newTx.ref);
    return NextResponse.json(newTx);
  } catch (error) {
    console.error(`[API] Create transaction FAILED:`, error);
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { ref, action } = await request.json();
    const db = await getDb();

    if (action === 'delete') {
      await db.run('DELETE FROM transactions WHERE ref = ?', [ref]);
      return NextResponse.json({ success: true });
    }

    const status = action === 'approve' ? 'confirmed' : 'rejected';
    await db.run('UPDATE transactions SET status = ? WHERE ref = ?', [status, ref]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 });
  }
}
