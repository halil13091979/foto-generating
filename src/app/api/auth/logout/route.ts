import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth-store';
import { clearSessionCookie, readSessionToken } from '@/lib/session-cookie';

export async function POST(request: Request): Promise<NextResponse> {
  const token = readSessionToken(request);
  await destroySession(token);
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response);
  return response;
}
