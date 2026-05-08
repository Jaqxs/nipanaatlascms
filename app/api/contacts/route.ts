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
