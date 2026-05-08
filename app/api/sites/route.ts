import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const db = await getDb();
    const sites = await db.all('SELECT * FROM sites ORDER BY name ASC');
    return NextResponse.json(sites);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sites' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    const id = crypto.randomUUID();

    await db.run(
      `INSERT INTO sites (id, name, location, manager, type, status, productionRate)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, body.name, body.location, body.manager, body.type, 'active', body.productionRate || 0]
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create site' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, action, ...updates } = await request.json();
    const db = await getDb();

    if (action === 'delete') {
      await db.run('DELETE FROM sites WHERE id = ?', [id]);
    } else {
      await db.run(
        `UPDATE sites SET name = ?, location = ?, manager = ?, type = ?, status = ? WHERE id = ?`,
        [updates.name, updates.location, updates.manager, updates.type, updates.status, id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update site' }, { status: 500 });
  }
}
