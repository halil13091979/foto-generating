import { NextResponse } from 'next/server';
import { grantWelcomeRays } from '@/lib/billing-store';
import { findUserById, getSession } from '@/lib/auth-store';
import { readSessionToken } from '@/lib/session-cookie';

export async function POST(request: Request): Promise<NextResponse> {
  const token = readSessionToken(request);
  const session = await getSession(token);
  if (!session) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  const account = await grantWelcomeRays(user.accountId);
  return NextResponse.json({ account });
}
