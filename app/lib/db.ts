import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { RECENT_TX, PENDING_INVOICES, INVENTORY_BATCHES, CUSTOMERS, SUPPLIERS } from './mockData';
import crypto from 'crypto';

import fs from 'fs';

let db: Database | null = null;

export async function getDb() {
  if (db) return db;

  // Use an absolute path for production stability
  const dataDir = '/app/data';
  const localDir = path.join(process.cwd(), 'data');
  
  // Detect if we are in Docker or Local
  const targetDir = fs.existsSync(dataDir) ? dataDir : localDir;
  
  if (!fs.existsSync(targetDir)) {
    console.log(`[DB] Creating data directory at ${targetDir}`);
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const dbPath = path.join(targetDir, 'gbms.db');
  console.log(`[DB] Connecting to database at: ${dbPath}`);
  
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    console.log(`[DB] Connection successful`);
    
    // Critical: Enable WAL mode to prevent "Database is locked" errors in Docker
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA foreign_keys = ON;');
    
  } catch (err) {
    console.error(`[DB] Connection FAILED:`, err);
    throw err;
  }

  await db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      ref TEXT UNIQUE,
      date TEXT,
      type TEXT,
      party TEXT,
      amount REAL,
      status TEXT,
      description TEXT,
      submittedBy TEXT DEFAULT 'J. Assey',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      no TEXT UNIQUE,
      customer TEXT,
      due TEXT,
      amount REAL,
      status TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      batch TEXT UNIQUE,
      weight REAL,
      karat INTEGER,
      fine REAL,
      location TEXT,
      status TEXT,
      value REAL,
      source TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      location TEXT,
      manager TEXT,
      type TEXT, 
      status TEXT DEFAULT 'active',
      productionRate REAL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      phone TEXT,
      location TEXT,
      type TEXT,
      totalPurchases REAL DEFAULT 0,
      outstanding REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      joined TEXT,
      lastTx TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quotations (
      id TEXT PRIMARY KEY,
      no TEXT UNIQUE,
      customer TEXT,
      expires TEXT,
      amount REAL,
      status TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  // Seed settings
  const settingsCount = await db.get('SELECT COUNT(*) as count FROM settings');
  if (settingsCount.count === 0) {
    await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['gold_price', JSON.stringify({ current: 0, asOf: 'Initializing...', source: 'System' })]);
    await db.run('INSERT INTO settings (key, value) VALUES (?, ?)', ['company_profile', JSON.stringify({ name: 'Your Company', tin: '', address: '', email: '', currency: 'USD' })]);
  }

  return db;
}

