import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import { RECENT_TX, PENDING_INVOICES, INVENTORY_BATCHES, CUSTOMERS, SUPPLIERS } from './mockData';
import crypto from 'crypto';

import fs from 'fs';

let db: Database | null = null;

export async function getDb() {
  if (db) return db;

  // DIAGNOSTIC: Use /tmp which is ALWAYS writable in Linux
  const dbPath = '/tmp/gbms.db';
  console.log(`[DB] DIAGNOSTIC PATH: ${dbPath}`);
  
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    await db.exec('PRAGMA journal_mode = WAL;');
    console.log(`[DB] SQLite initialized in WAL mode`);
  } catch (err: any) {
    const msg = `SQLITE_ERROR: ${err.message || 'Unknown'}. Path: ${dbPath}`;
    console.error(msg);
    throw new Error(msg);
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

