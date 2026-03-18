const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'sessions.db');

let db;

function initDB() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);

  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      seat_count INTEGER NOT NULL,
      canva_url TEXT,
      email TEXT,
      concluded INTEGER DEFAULT 0,
      data TEXT NOT NULL,
      updated_at TEXT
    )
  `);

  return Promise.resolve();
}

function getDB() {
  return db;
}

module.exports = { initDB, getDB };
