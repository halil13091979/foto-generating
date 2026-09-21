import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

const cookieName = 'sooli_admin_session';

export async function POST(request: Request) {
  const { password } = await request.json().catch(() => ({ password: '' }));
  const configuredPassword = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!configuredPassword || !secret) return NextResponse.json({ error: 'Админ-доступ не настроен на сервере' }, { status: 503 });

  const provided = Buffer.from(String(password ?? ''));
  const expected = Buffer.from(configuredPassword);
  const matches = provided.length === expected.length && timingSafeEqual(provided, expected);
  if (!matches) return NextResponse.json({ error: 'Неверный пароль' }, { status: 401 });

  const timestamp = String(Date.now());
  const signature = createHmac('sha256', secret).update(timestamp).digest('hex');
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, `${timestamp}.${signature}`, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/admin', maxAge: 60 * 60 * 8 });
  return response;
}
