import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Define the persistent storage path (Dokploy/VPS friendly)
const IS_CONTAINER = fs.existsSync('/app/data');
const STORAGE_PATH = IS_CONTAINER ? '/app/data/gbms.json' : path.join(process.cwd(), 'gbms.json');

export async function GET() {
  console.log("[STORAGE_API] Incoming fetch request for global state...");
  try {
    if (fs.existsSync(STORAGE_PATH)) {
      const data = fs.readFileSync(STORAGE_PATH, 'utf8');
      console.log("[STORAGE_API] State found and served.");
      return NextResponse.json(JSON.parse(data));
    }
    console.log("[STORAGE_API] No state file found. Serving empty.");
    return NextResponse.json({});
  } catch (error) {
    console.error("[STORAGE_API] Read error:", error);
    return NextResponse.json({ error: "Failed to read storage" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  console.log("[STORAGE_API] Incoming sync push from device...");
  try {
    const data = await req.json();
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    
    // Write to persistent disk
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(data, null, 2));
    console.log("[STORAGE_API] Global state updated and persisted to disk.");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[STORAGE_API] Save failed:", error);
    return NextResponse.json({ error: "Failed to save storage" }, { status: 500 });
  }
}
