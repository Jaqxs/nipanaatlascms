const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '../gbms.db');

// Delete existing DB if you want a fresh start (optional)
// if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initializeTables();
    }
});

function initializeTables() {
    db.serialize(() => {
        // Create tables logic... 
        // Note: The app handles this automatically in app/lib/db.ts
        // This script is just a helper for manual verification
        console.log("Database is managed by Next.js app in app/lib/db.ts");
        console.log("Just run 'npm run build && npm run start' or use Docker.");
    });
    db.close();
}
