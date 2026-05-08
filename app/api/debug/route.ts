import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';

export async function GET() {
  const reports = [];
  
  // Test 1: Filesystem
  const dataDir = '/app/data';
  try {
    const exists = fs.existsSync(dataDir);
    const writable = exists ? (function() {
      try {
        fs.writeFileSync(path.join(dataDir, '.test-write'), 'test');
        fs.unlinkSync(path.join(dataDir, '.test-write'));
        return true;
      } catch (e) { return false; }
    })() : false;
    
    reports.push({ test: "Folder Access", result: exists ? "Found" : "Not Found", writable });
  } catch (e) {
    reports.push({ test: "Folder Access", result: "Error", error: e.message });
  }

  // Test 2: SQLite Driver
  try {
    const drv = sqlite3.verbose();
    reports.push({ test: "SQLite Driver", result: "Loaded", version: "Standard" });
  } catch (e) {
    reports.push({ test: "SQLite Driver", result: "Failed", error: e.message });
  }

  return NextResponse.json({ 
    status: "Diagnostics Complete",
    time: new Date().toISOString(),
    reports 
  });
}
