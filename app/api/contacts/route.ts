import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import crypto from 'crypto';

export async function GET() {
  try {
    const db = await getDb();
    const contacts = await db.all('SELECT * FROM contacts ORDER BY name ASC');
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    
    const id = crypto.randomUUID();
    const typePrefix = body.type === 'customer' ? 'CUST' : 'SUPP';
    const contactId = body.id || `${typePrefix}-2026-${Math.floor(Math.random() * 1000000).toString().padStart(6, '0')}`;
    
    await db.run(
      `INSERT INTO contacts (id, name, email, phone, location, type, totalPurchases, outstanding, status, joined)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [contactId, body.name, body.email, body.phone, body.location, body.type, body.totalPurchases || 0, body.outstanding || 0, body.status || 'active', new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })]
    );

    const newContact = await db.get('SELECT * FROM contacts WHERE id = ?', contactId);
    return NextResponse.json(newContact);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
export async function PATCH(request: Request) {
  try {
    const { id, action, ...updates } = await request.json();
    const db = await getDb();

    if (action === 'delete') {
      await db.run('DELETE FROM contacts WHERE id = ?', [id]);
      return NextResponse.json({ success: true, message: 'Contact deleted' });
    }

    if (action === 'status') {
      const current = await db.get('SELECT status FROM contacts WHERE id = ?', [id]);
      const next = current?.status === 'active' ? 'inactive' : 'active';
      await db.run('UPDATE contacts SET status = ? WHERE id = ?', [next, id]);
      return NextResponse.json({ success: true, status: next });
    }

    // Generic update
    const keys = Object.keys(updates);
    if (keys.length > 0) {
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = keys.map(k => updates[k]);
      await db.run(`UPDATE contacts SET ${setClause} WHERE id = ?`, [...values, id]);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to update contact', details: error.message }, { status: 500 });
  }
}
