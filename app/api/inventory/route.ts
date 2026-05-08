import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const db = await getDb();
    const inventory = await db.all('SELECT * FROM inventory ORDER BY createdAt DESC');
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    
    const id = crypto.randomUUID();
    const batch = body.batch || `BATCH-${new Date().toISOString().slice(0,10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
    
    await db.run(
      `INSERT INTO inventory (id, batch, weight, karat, fine, location, status, value, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, batch, body.weight, body.karat, body.fine, body.location, body.status || 'Available', body.value, body.source]
    );

    const newItem = await db.get('SELECT * FROM inventory WHERE id = ?', id);
    return NextResponse.json(newItem);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create inventory item' }, { status: 500 });
  }
}
