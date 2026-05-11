import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the persistent storage path (Dokploy/VPS friendly)
const IS_CONTAINER = fs.existsSync('/app/data');
const STORAGE_PATH = IS_CONTAINER ? '/app/data/gbms.json' : path.join(process.cwd(), 'gbms.json');

export async function GET() {
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const data = fs.readFileSync(STORAGE_PATH, 'utf8');
      return NextResponse.json(JSON.parse(data));
    }
    return NextResponse.json({});
  } catch (error) {
    return NextResponse.json({ error: "Failed to read storage" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    
    // Write to persistent disk
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[STORAGE_API] Save failed:", error);
    return NextResponse.json({ error: "Failed to save storage" }, { status: 500 });
  }
}
