import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // Transactions
    const txs = await db.all('SELECT amount, type FROM transactions');
    const totalSales = txs.filter(t => t.amount > 0).reduce((a, b) => a + b.amount, 0);
    const totalExpenses = Math.abs(txs.filter(t => t.amount < 0).reduce((a, b) => a + b.amount, 0));
    const netProfit = totalSales - totalExpenses;

    // Inventory
    const inventory = await db.all('SELECT weight, value FROM inventory');
    const stockWeight = inventory.reduce((a, b) => a + b.weight, 0);
    const stockValue = inventory.reduce((a, b) => a + b.value, 0);

    // Invoices
    const pendingInvoices = await db.all("SELECT amount FROM invoices WHERE status != 'Paid'");
    const pendingInvoicesValue = pendingInvoices.reduce((a, b) => a + b.amount, 0);

    return NextResponse.json({
      totalSales,
      totalExpenses,
      netProfit,
      stockWeight,
      stockValue,
      cashPosition: totalSales - totalExpenses, // Simple approximation
      pendingInvoices: { count: pendingInvoices.length, value: pendingInvoicesValue },
      activeQuotations: 5 // Static for now as I haven't implemented Quotations API
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
