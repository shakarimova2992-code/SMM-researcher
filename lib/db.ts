import { promises as fs } from "fs";
import os from "os";
import path from "path";

// Простое файловое хранилище для прототипа.
// В проде легко заменить на Postgres/Supabase/PlanetScale — интерфейс тот же.
//
// На serverless-платформах (Vercel и т.п.) папка проекта доступна только на чтение —
// запись разрешена лишь во временную папку ОС. Поэтому там храним db.json в os.tmpdir(),
// а не в папке проекта. Локально (`npm run dev`/`npm run start`) по-прежнему пишем прямо
// в data/db.json, чтобы данные переживали перезапуск сервера при разработке.
// ⚠️ /tmp на serverless — эфемерный: обнуляется при холодном старте/новом деплое.
// Для реальных клиентов (не только вашего тестирования) нужно подключить настоящую БД.
const DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "nichescope-data") : path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

export type UserRecord = {
  email: string;
  boundAccount: string | null; // username IG-аккаунта, привязанного к этому логину
  boundNiche: string | null;
  createdAt: number;
};

export type TokenRecord = {
  token: string;
  email: string;
  expiresAt: number;
};

type DB = {
  users: Record<string, UserRecord>;
  tokens: Record<string, TokenRecord>;
};

const EMPTY_DB: DB = { users: {}, tokens: {} };

let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureFile() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(EMPTY_DB, null, 2));
  }
}

async function readDB(): Promise<DB> {
  await ensureFile();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw) as DB;
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

async function writeDB(db: DB) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

// Все мутации идут через очередь, чтобы параллельные запросы не затирали друг друга
function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = writeQueue.then(async () => {
    const db = await readDB();
    const result = await fn(db);
    await writeDB(db);
    return result;
  });
  writeQueue = run.catch(() => {});
  return run;
}

export async function getUser(email: string): Promise<UserRecord | null> {
  const db = await readDB();
  return db.users[email.toLowerCase()] ?? null;
}

export async function upsertUser(email: string): Promise<UserRecord> {
  const key = email.toLowerCase();
  return mutate((db) => {
    if (!db.users[key]) {
      db.users[key] = {
        email: key,
        boundAccount: null,
        boundNiche: null,
        createdAt: Date.now(),
      };
    }
    return db.users[key];
  });
}

export async function bindAccount(email: string, username: string, niche: string): Promise<UserRecord> {
  const key = email.toLowerCase();
  return mutate((db) => {
    const user = db.users[key] ?? { email: key, boundAccount: null, boundNiche: null, createdAt: Date.now() };
    if (!user.boundAccount) {
      user.boundAccount = username;
      user.boundNiche = niche;
    }
    db.users[key] = user;
    return user;
  });
}

export async function resetAccount(email: string): Promise<UserRecord | null> {
  const key = email.toLowerCase();
  return mutate((db) => {
    const user = db.users[key];
    if (user) {
      user.boundAccount = null;
      user.boundNiche = null;
    }
    return user ?? null;
  });
}

export async function createToken(email: string, token: string, ttlMs: number): Promise<TokenRecord> {
  return mutate((db) => {
    const record: TokenRecord = { token, email: email.toLowerCase(), expiresAt: Date.now() + ttlMs };
    db.tokens[token] = record;
    return record;
  });
}

export async function consumeToken(token: string): Promise<TokenRecord | null> {
  return mutate((db) => {
    const record = db.tokens[token];
    if (!record) return null;
    delete db.tokens[token];
    if (record.expiresAt < Date.now()) return null;
    return record;
  });
}
