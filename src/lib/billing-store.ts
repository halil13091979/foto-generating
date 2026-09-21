/**
 * Учёт внутренней валюты «лучи».
 *
 * Хранение реализовано поверх JSON-файла в каталоге data/, чтобы не тянуть
 * внешние зависимости на этапе прототипа. Интерфейс специально изолирован —
 * позже его можно заменить на Prisma/SQLite без изменений вызывающего кода.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { WELCOME_RAYS, type RaysOperation, getRaysCost } from './rays';

export type RaysTransactionType = 'welcome' | 'purchase' | 'spend' | 'refund';

export type RaysTransaction = {
  id: string;
  type: RaysTransactionType;
  amount: number;
  balance: number;
  description: string;
  createdAt: string;
};

export type RaysAccount = {
  accountId: string;
  balance: number;
  welcomeGranted: boolean;
  transactions: RaysTransaction[];
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'billing.json');

let writeQueue: Promise<unknown> = Promise.resolve();

function emptyAccount(accountId: string): RaysAccount {
  return {
    accountId,
    balance: 0,
    welcomeGranted: false,
    transactions: [],
    updatedAt: new Date().toISOString(),
  };
}

async function readAll(): Promise<Record<string, RaysAccount>> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Record<string, RaysAccount>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
    throw error;
  }
}

async function writeAll(data: Record<string, RaysAccount>): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Последовательно выполняет операции над файлом, чтобы параллельные запросы
 * не перезаписывали друг друга.
 */
function enqueue<T>(task: () => Promise<T>): Promise<T> {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => undefined);
  return run;
}

function makeTransaction(
  type: RaysTransactionType,
  amount: number,
  balance: number,
  description: string,
): RaysTransaction {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    amount,
    balance,
    description,
    createdAt: new Date().toISOString(),
  };
}

export async function getAccount(accountId: string): Promise<RaysAccount> {
  const all = await readAll();
  return all[accountId] ?? emptyAccount(accountId);
}

export async function grantWelcomeRays(accountId: string): Promise<RaysAccount> {
  return enqueue(async () => {
    const all = await readAll();
    const account = all[accountId] ?? emptyAccount(accountId);
    if (account.welcomeGranted) return account;

    account.balance += WELCOME_RAYS;
    account.welcomeGranted = true;
    account.updatedAt = new Date().toISOString();
    account.transactions.push(
      makeTransaction('welcome', WELCOME_RAYS, account.balance, 'Приветственные лучи за регистрацию'),
    );
    all[accountId] = account;
    await writeAll(all);
    return account;
  });
}

export async function topUpRays(
  accountId: string,
  amount: number,
  description = 'Покупка пакета лучей',
): Promise<RaysAccount> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Сумма пополнения должна быть положительным числом');
  }
  return enqueue(async () => {
    const all = await readAll();
    const account = all[accountId] ?? emptyAccount(accountId);
    account.balance += amount;
    account.updatedAt = new Date().toISOString();
    account.transactions.push(makeTransaction('purchase', amount, account.balance, description));
    all[accountId] = account;
    await writeAll(all);
    return account;
  });
}

export async function spendRays(
  accountId: string,
  operation: RaysOperation,
  description?: string,
): Promise<RaysAccount> {
  const cost = getRaysCost(operation);
  return enqueue(async () => {
    const all = await readAll();
    const account = all[accountId] ?? emptyAccount(accountId);
    if (account.balance < cost) {
      throw new Error(`Недостаточно лучей: нужно ${cost}, доступно ${account.balance}`);
    }
    account.balance -= cost;
    account.updatedAt = new Date().toISOString();
    account.transactions.push(
      makeTransaction('spend', -cost, account.balance, description ?? `Списание за операцию ${operation}`),
    );
    all[accountId] = account;
    await writeAll(all);
    return account;
  });
}

export async function refundRays(
  accountId: string,
  operation: RaysOperation,
  description = 'Возврат лучей за неудачную генерацию',
): Promise<RaysAccount> {
  const cost = getRaysCost(operation);
  return enqueue(async () => {
    const all = await readAll();
    const account = all[accountId] ?? emptyAccount(accountId);
    account.balance += cost;
    account.updatedAt = new Date().toISOString();
    account.transactions.push(makeTransaction('refund', cost, account.balance, description));
    all[accountId] = account;
    await writeAll(all);
    return account;
  });
}
