import { SESSION_COOKIE } from './session-constants';

export { SESSION_COOKIE };

export function readSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/(?:^|;\s*)sooli_session=([^;]+)/);
  if (match) return decodeURIComponent(match[1]);
  return null;
}

export function attachSessionCookie(response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } }, token: string): void {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearSessionCookie(response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } }): void {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}
