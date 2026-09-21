import { NextResponse } from 'next/server';
import { verifyUserEmail } from '@/lib/auth-store';

export async function GET(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/verify-email?status=error', request.url));
  }

  const user = await verifyUserEmail(token);
  if (!user) {
    return NextResponse.redirect(new URL('/verify-email?status=error', request.url));
  }

  return NextResponse.redirect(new URL('/verify-email?status=success', request.url));
}
