import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const db = await getDb();
    const inventory = await db.all('SELECT * FROM inventory ORDER BY id DESC');
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
    const batch = body.batch || `BATCH-${Date.now()}`;

    await db.run(
      `INSERT INTO inventory (id, batch, weight, karat, fine, location, status, value, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, batch, body.weight, body.karat, body.fine, body.location, 'active', body.value, body.source]
    );

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error("[API ERROR] Failed to add inventory:", error.message || error);
    return NextResponse.json({ error: 'Failed to add inventory', details: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, action } = await request.json();
    const db = await getDb();

    if (action === 'delete') {
      await db.run('DELETE FROM inventory WHERE id = ?', [id]);
    } else if (action === 'sell') {
      await db.run('UPDATE inventory SET status = ? WHERE id = ?', ['sold', id]);
    } else if (action === 'process' || action === 'refine') {
      await db.run('UPDATE inventory SET status = ? WHERE id = ?', ['processing', id]);
    } else if (action === 'archive') {
      await db.run('UPDATE inventory SET status = ? WHERE id = ?', ['archived', id]);
    } else if (action === 'move') {
      // In a real app we'd update location, but for now we'll just confirm the action
      await db.run('UPDATE inventory SET status = ? WHERE id = ?', ['active', id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 });
  }
}
