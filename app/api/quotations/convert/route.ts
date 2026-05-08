import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { quotationId } = await request.json();
    const db = await getDb();
    
    // Get quotation
    const quotation = await db.get('SELECT * FROM quotations WHERE id = ?', quotationId);
    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 404 });
    }
    
    // Create invoice
    const invoiceId = crypto.randomUUID();
    const invoiceNo = `INV-2026-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    await db.run(
      'INSERT INTO invoices (id, no, customer, due, amount, status) VALUES (?, ?, ?, ?, ?, ?)',
      [invoiceId, invoiceNo, quotation.customer, dueDate.toISOString().split('T')[0], quotation.amount, 'sent']
    );
    
    // Update quotation status
    await db.run('UPDATE quotations SET status = ? WHERE id = ?', ['CONVERTED', quotationId]);
    
    return NextResponse.json({ invoiceId, invoiceNo, message: 'Converted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to convert quotation' }, { status: 500 });
  }
}
