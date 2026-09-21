import { NextResponse } from 'next/server';
import { refundRays } from '@/lib/billing-store';
import { type RaysOperation, OPERATION_LABELS } from '@/lib/rays';
import { findUserById, getSession } from '@/lib/auth-store';
import { readSessionToken } from '@/lib/session-cookie';

const VALID_OPERATIONS: RaysOperation[] = ['photo-1k', 'photo-2k', 'photo-4k', 'improve', 'video-5s', 'video-10s'];

async function readAccountId(request: Request): Promise<string | null> {
  const token = readSessionToken(request);
  const session = await getSession(token);
  if (!session) return null;
  const user = await findUserById(session.userId);
  return user?.accountId ?? null;
}

function isRaysOperation(value: unknown): value is RaysOperation {
  return typeof value === 'string' && (VALID_OPERATIONS as string[]).includes(value);
}

export async function POST(request: Request): Promise<NextResponse> {
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (!internalSecret || request.headers.get('x-internal-api-secret') !== internalSecret) {
    return NextResponse.json({ error: 'Внутренний маршрут недоступен напрямую' }, { status: 403 });
  }

  const accountId = await readAccountId(request);
  if (!accountId) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { operation?: unknown; description?: unknown };
  if (!isRaysOperation(body.operation)) {
    return NextResponse.json({ error: 'Некорректная операция' }, { status: 400 });
  }

  const description = typeof body.description === 'string' && body.description.length
    ? body.description
    : `Возврат лучей за операцию «${OPERATION_LABELS[body.operation]}»`;

  try {
    const account = await refundRays(accountId, body.operation, description);
    return NextResponse.json({ account });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось вернуть лучи';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
