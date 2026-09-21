import { NextResponse } from 'next/server';
import { getAccount, topUpRays } from '@/lib/billing-store';
import { findUserById, getSession } from '@/lib/auth-store';
import { readSessionToken } from '@/lib/session-cookie';

async function readAccountId(request: Request): Promise<string | null> {
  const token = readSessionToken(request);
  const session = await getSession(token);
  if (!session) return null;
  const user = await findUserById(session.userId);
  return user?.accountId ?? null;
}

export async function GET(request: Request): Promise<NextResponse> {
  const accountId = await readAccountId(request);
  if (!accountId) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  const account = await getAccount(accountId);
  return NextResponse.json({ account });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (process.env.ALLOW_DIRECT_RAYS_TOPUP !== 'true') {
    return NextResponse.json({ error: 'Пополнение доступно только после подтверждения платежа' }, { status: 503 });
  }

  const accountId = await readAccountId(request);
  if (!accountId) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { amount?: unknown; description?: unknown };
  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Некорректная сумма пополнения' }, { status: 400 });
  }

  const description = typeof body.description === 'string' && body.description.length
    ? body.description
    : 'Покупка пакета лучей';

  const account = await topUpRays(accountId, amount, description);
  return NextResponse.json({ account });
}
