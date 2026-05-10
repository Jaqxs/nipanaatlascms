import { NextResponse } from 'next/server';
import { getDb } from '@/app/lib/db';

export async function GET() {
  try {
    const db = await getDb();
    const settingsRows = await db.all('SELECT * FROM settings');
    const settings: any = {};
    settingsRows.forEach((row: any) => {
      settings[row.key] = JSON.parse(row.value);
    });
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const db = await getDb();
    
    for (const [key, value] of Object.entries(body)) {
      await db.run(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, JSON.stringify(value)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
