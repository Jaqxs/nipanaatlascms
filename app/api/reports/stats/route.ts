import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    
    // 1. Transactions stats
    const txs = await db.all("SELECT type, amount, status, date FROM transactions") as any[];
    
    // 2. Invoices stats
    const invoices = await db.all("SELECT status, amount FROM invoices") as any[];
    
    // 3. Inventory stats
    const inventory = await db.all("SELECT weight, karat, value FROM inventory") as any[];

    // Aggregates
    const stats = {
      txCount: txs.length,
      revenue: txs.filter((t: any) => t.amount > 0).reduce((a: number, b: any) => a + b.amount, 0),
      expenses: Math.abs(txs.filter((t: any) => t.amount < 0).reduce((a: number, b: any) => a + b.amount, 0)),
      invoiceCount: invoices.length,
      stockWeight: inventory.reduce((a: number, b: any) => a + (b.weight || 0), 0),
      stockValue: inventory.reduce((a: number, b: any) => a + (b.value || 0), 0),
      monthlyTrend: calculateMonthlyTrend(txs)
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Reports API error:", error);
    return NextResponse.json({ error: "Failed to fetch report data" }, { status: 500 });
  }
}

function calculateMonthlyTrend(txs: any[]) {
  // Simple month bucket logic
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  
  const buckets: Record<string, { revenue: number, profit: number }> = {};
  
  txs.forEach(t => {
    const d = new Date(t.date);
    const m = months[d.getMonth()];
    if (!buckets[m]) buckets[m] = { revenue: 0, profit: 0 };
    
    if (t.amount > 0) buckets[m].revenue += t.amount;
    buckets[m].profit += t.amount;
  });

  return months.map(m => ({
    m,
    revenue: buckets[m]?.revenue || 0,
    profit: buckets[m]?.profit || 0
  })).slice(-6); // Last 6 months
}
