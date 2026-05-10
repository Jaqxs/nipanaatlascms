import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  const folders = [
    { name: 'App Data', path: '/app/data' },
    { name: 'Current Dir', path: path.join(process.cwd(), 'data') },
    { name: 'System Tmp', path: '/tmp' }
  ];

  const results = folders.map((f: any) => {
    let exists = false;
    let writable = false;
    let error = null;

    try {
      exists = fs.existsSync(f.path);
      if (!exists) {
        fs.mkdirSync(f.path, { recursive: true });
        exists = true;
      }
      const testFile = path.join(f.path, 'test_write.txt');
      fs.writeFileSync(testFile, 'OK-' + new Date().toISOString());
      fs.unlinkSync(testFile);
      writable = true;
    } catch (e: any) {
      error = e.message;
    }

    return { ...f, exists, writable, error };
  });

  return NextResponse.json({
    status: 'FLIGHT_RECORDER_ACTIVE',
    timestamp: new Date().toISOString(),
    folder_diagnostics: results,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      CWD: process.cwd(),
      USER: process.env.USER || 'unknown'
    }
  });
}
