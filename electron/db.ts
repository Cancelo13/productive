import path from "path";
import fs from "fs";
import os from "os";
import { app } from "electron";
import * as schema from "../shared/schema";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

let db: any;

// SQLite fallback (offline mode)
try {
  // Ensure data directory exists
  let baseDir: string;
  try {
    baseDir = app.getPath("userData");
  } catch {
    baseDir = process.env.APPDATA || process.env.LOCALAPPDATA || os.tmpdir();
  }

  const dataDir = path.join(baseDir, "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlitePath = path.join(dataDir, "database.sqlite");
  const sqlite = new Database(sqlitePath);

  // Create db instance
  db = drizzle(sqlite, { schema });

  // Initialize schema - run migrations synchronously
  
  // Create tables if they don't exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0,
      priority TEXT NOT NULL DEFAULT 'medium',
      date TEXT DEFAULT NULL
    );

    CREATE TABLE IF NOT EXISTS work_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      duration INTEGER
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      target_date TEXT NOT NULL,
      current_progress INTEGER NOT NULL DEFAULT 0,
      target_value INTEGER NOT NULL DEFAULT 100,
      unit TEXT NOT NULL DEFAULT '%',
      completed INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      streak INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS habit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      completed_at TEXT NOT NULL DEFAULT CURRENT_DATE
    );
  `);
} catch (e) {
  console.error("Failed to initialize SQLite database:", e);
  throw e;
}


export { db };
export const pool = null; // No pool for SQLite
