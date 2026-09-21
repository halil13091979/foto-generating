/**
 * Учёт пользователей и серверных сессий.
 *
 * Как и billing-store, хранение реализовано поверх JSON-файлов в каталоге data/,
 * чтобы не тянуть внешние зависимости на этапе прототипа. Интерфейс изолирован —
 * позже его можно заменить на Prisma/SQLite без изменений вызывающего кода.
 *
 * Пароли хранятся только в виде scrypt-хэша (salt:hash), сам пароль нигде не сохраняется.
 */

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

export type UserRecord = {
  userId: string;
  email: string;
  name: string;
  company: string;
  role: string;
  passwordHash: string;
  accountId: string;
  isEmailVerified: boolean;
  emailVerificationToken: string | null;
  createdAt: string;
  updatedAt: string;
};

export type SessionRecord = {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
};

export type PublicUser = Omit<UserRecord, 'passwordHash'>;

let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf8');
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2), 'utf8');
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createUserId(): string {
  return `usr_${randomBytes(8).toString('hex')}`;
}

export function createAccountId(): string {
  return `acc_${randomBytes(8).toString('hex')}`;
}

export function createSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function createEmailVerificationToken(): string {
  return randomBytes(24).toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}

export function toPublicUser(user: UserRecord): PublicUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const users = await readJson<Record<string, UserRecord>>(USERS_FILE, {});
  const target = normalizeEmail(email);
  return Object.values(users).find((user) => user.email === target) ?? null;
}

export async function findUserById(userId: string): Promise<UserRecord | null> {
  const users = await readJson<Record<string, UserRecord>>(USERS_FILE, {});
  return users[userId] ?? null;
}

export async function createUser(input: {
  email: string;
  name: string;
  company: string;
  role: string;
  password: string;
  accountId: string;
}): Promise<UserRecord> {
  const email = normalizeEmail(input.email);
  if (!email.includes('@')) throw new Error('Некорректный email');
  if (input.password.length < 6) throw new Error('Пароль должен содержать минимум 6 символов');

  return enqueue(async () => {
    const users = await readJson<Record<string, UserRecord>>(USERS_FILE, {});
    const exists = Object.values(users).some((user) => user.email === email);
    if (exists) throw new Error('Пользователь с таким email уже зарегистрирован');

    const now = new Date().toISOString();
    const user: UserRecord = {
      userId: createUserId(),
      email,
      name: input.name.trim() || 'Пользователь Sooli',
      company: input.company.trim() || 'Не указана',
      role: input.role.trim() || 'Владелец проекта',
      passwordHash: await hashPassword(input.password),
      accountId: input.accountId,
      isEmailVerified: false,
      emailVerificationToken: createEmailVerificationToken(),
      createdAt: now,
      updatedAt: now,
    };

    users[user.userId] = user;
    await writeJson(USERS_FILE, users);
    return user;
  });
}

export async function updateUser(
  userId: string,
  patch: Partial<Pick<UserRecord, 'name' | 'company' | 'role'>>,
): Promise<UserRecord | null> {
  return enqueue(async () => {
    const users = await readJson<Record<string, UserRecord>>(USERS_FILE, {});
    const user = users[userId];
    if (!user) return null;

    const updated: UserRecord = {
      ...user,
      name: patch.name?.trim() || user.name,
      company: patch.company?.trim() || user.company,
      role: patch.role?.trim() || user.role,
      updatedAt: new Date().toISOString(),
    };

    users[userId] = updated;
    await writeJson(USERS_FILE, users);
    return updated;
  });
}

export async function createSession(
  userId: string,
  ttlMs = 1000 * 60 * 60 * 24 * 30,
): Promise<SessionRecord> {
  return enqueue(async () => {
    const sessions = await readJson<Record<string, SessionRecord>>(SESSIONS_FILE, {});
    const now = Date.now();
    const token = createSessionToken();
    const session: SessionRecord = {
      token,
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + ttlMs).toISOString(),
    };

    sessions[token] = session;
    await writeJson(SESSIONS_FILE, sessions);
    return session;
  });
}

export async function getSession(token: string | null): Promise<SessionRecord | null> {
  if (!token) return null;
  const sessions = await readJson<Record<string, SessionRecord>>(SESSIONS_FILE, {});
  const session = sessions[token];
  if (!session) return null;
  if (new Date(session.expiresAt).getTime() < Date.now()) {
    delete sessions[token];
    await writeJson(SESSIONS_FILE, sessions);
    return null;
  }
  return session;
}

export async function destroySession(token: string | null): Promise<void> {
  if (!token) return;
  await enqueue(async () => {
    const sessions = await readJson<Record<string, SessionRecord>>(SESSIONS_FILE, {});
    if (sessions[token]) {
      delete sessions[token];
      await writeJson(SESSIONS_FILE, sessions);
    }
  });
}

export async function verifyUserEmail(token: string): Promise<UserRecord | null> {
  if (!token) return null;
  const users = await readJson<Record<string, UserRecord>>(USERS_FILE, {});
  const user = Object.values(users).find((item) => item.emailVerificationToken === token) ?? null;
  if (!user) return null;

  const updated: UserRecord = {
    ...user,
    isEmailVerified: true,
    emailVerificationToken: null,
    updatedAt: new Date().toISOString(),
  };

  users[user.userId] = updated;
  await writeJson(USERS_FILE, users);
  return updated;
}
