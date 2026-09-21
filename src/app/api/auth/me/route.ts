import { NextResponse } from 'next/server';
import { findUserById, getSession, toPublicUser } from '@/lib/auth-store';
import { readSessionToken } from '@/lib/session-cookie';

export async function GET(request: Request): Promise<NextResponse> {
  const token = readSessionToken(request);
  const session = await getSession(token);
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const user = await findUserById(session.userId);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  return NextResponse.json({ user: toPublicUser(user) });
}
