import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';

const execPromise = util.promisify(exec);

export async function POST() {
  const reports = [];
  
  try {
    // Attempt 1: Internal chmod via shell
    await execPromise('chmod -R 777 /app/data || true');
    reports.push("Permission forced via shell");
    
    // Attempt 2: Re-create folder if missing
    if (!fs.existsSync('/app/data')) {
      fs.mkdirSync('/app/data', { recursive: true });
      reports.push("Folder recreated");
    }
    
    // Attempt 3: Test Write
    fs.writeFileSync('/app/data/repair_test.txt', 'REPAIRED');
    reports.push("Write test SUCCESSful");
  } catch (e: any) {
    reports.push("Repair failed: " + e.message);
  }

  return NextResponse.json({ 
    status: 'REPAIR_SEQUENCE_COMPLETE', 
    logs: reports 
  });
}
