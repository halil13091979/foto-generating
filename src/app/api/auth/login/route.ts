import { NextResponse } from 'next/server';
import { createSession, findUserByEmail, toPublicUser, verifyPassword } from '@/lib/auth-store';
import { attachSessionCookie } from '@/lib/session-cookie';

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as { email?: string; password?: string };
  const email = (body.email ?? '').trim();
  const password = body.password ?? '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Укажите email и пароль' }, { status: 400 });
  }

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: 'Неверный email или пароль' }, { status: 401 });
  }

  if (!user.isEmailVerified) {
    return NextResponse.json({ error: 'Подтвердите email по ссылке из письма перед входом' }, { status: 403 });
  }

  const session = await createSession(user.userId);
  const response = NextResponse.json({ user: toPublicUser(user) });
  attachSessionCookie(response, session.token);
  return response;
}
