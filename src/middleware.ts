import { NextRequest, NextResponse } from 'next/server';

const SESSION_COOKIE = 'sooli_admin_session';

async function isValidSession(value: string | undefined, secret: string | undefined) {
  if (!value || !secret) return false;
  const [timestamp, signature] = value.split('.');
  if (!timestamp || !signature || Number.isNaN(Number(timestamp)) || Date.now() - Number(timestamp) > 8 * 60 * 60 * 1000) return false;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
  const bytes = signature.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) ?? [];
  return crypto.subtle.verify('HMAC', key, Uint8Array.from(bytes), new TextEncoder().encode(timestamp));
}

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === '/admin/login') return NextResponse.next();
  const valid = await isValidSession(request.cookies.get(SESSION_COOKIE)?.value, process.env.ADMIN_SESSION_SECRET);
  if (!valid) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('from', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
