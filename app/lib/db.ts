import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';

let db: Database | null = null;

export async function getDb() {
  if (db) return db;

  const dbPath = ':memory:';
  console.log(`[DB] MEMORY MODE ENABLED`);

  try {
    const sqlite3Verbose = sqlite3.verbose();
    db = await open({
      filename: dbPath,
      driver: sqlite3Verbose.Database
    });
    
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec('PRAGMA foreign_keys = ON;');
    console.log(`[DB] Successfully connected to ${dbPath}`);
  } catch (err: any) {
    console.error(`[DB] FATAL ERROR: ${err.message}`);
    throw new Error(`SQLITE_DRIVER_ERROR: ${err.message}`);
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

  return db;
}
