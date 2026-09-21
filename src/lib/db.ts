/**
 * Доступ к базе данных Sooli (файловая SQLite через @libsql/client).
 *
 * Драйвер выбран без нативной сборки: better-sqlite3 не ставится в этом
 * окружении (нет MSVC / node-gyp), а @libsql/client работает на чистом JS
 * и поддерживает локальный файл file:data/sooli.db.
 */

import { createClient, type Client, type InValue } from '@libsql/client';
import path from 'node:path';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sooli.db');

let client: Client | null = null;

function toFileUrl(file: string): string {
  return `file:${file.replace(/\\/g, '/')}`;
}

export function getDb(): Client {
  if (!client) {
    client = createClient({ url: toFileUrl(DB_FILE) });
  }
  return client;
}

let initPromise: Promise<void> | null = null;

export function initDb(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = getDb();
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          userId TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          company TEXT NOT NULL,
          role TEXT NOT NULL,
          passwordHash TEXT NOT NULL,
          accountId TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          token TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          expiresAt TEXT NOT NULL
        );
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS accounts (
          accountId TEXT PRIMARY KEY,
          balance INTEGER NOT NULL DEFAULT 0,
          welcomeGranted INTEGER NOT NULL DEFAULT 0,
          updatedAt TEXT NOT NULL
        );
      `);
      await db.execute(`
        CREATE TABLE IF NOT EXISTS transactions (
          id TEXT PRIMARY KEY,
          accountId TEXT NOT NULL,
          type TEXT NOT NULL,
          amount INTEGER NOT NULL,
          balance INTEGER NOT NULL,
          description TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId);`);
      await db.execute(`CREATE INDEX IF NOT EXISTS idx_transactions_accountId ON transactions(accountId);`);
    })().catch((error) => {
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

export type Row = Record<string, InValue>;

export function mapRows(rows: Array<Record<string, unknown>>): Row[] {
  return rows as Row[];
}
