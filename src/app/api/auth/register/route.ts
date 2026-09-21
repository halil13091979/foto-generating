import { NextResponse } from 'next/server';
import { createUser, findUserByEmail, toPublicUser } from '@/lib/auth-store';
import { grantWelcomeRays } from '@/lib/billing-store';
import { createAccountId } from '@/lib/auth-store';
import { buildWelcomeEmailHtml, sendEmail } from '@/lib/email';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      company?: string;
      role?: string;
      password?: string;
    };

    const email = (body.email ?? '').trim();
    const password = body.password ?? '';
    if (!email || !password) {
      return NextResponse.json({ error: 'Укажите email и пароль' }, { status: 400 });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'Пользователь с таким email уже зарегистрирован' }, { status: 409 });
    }

    const accountId = createAccountId();
    const user = await createUser({
      email,
      name: body.name ?? '',
      company: body.company ?? '',
      role: body.role ?? '',
      password,
      accountId,
    });

    await grantWelcomeRays(accountId);

    const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/auth/verify-email?token=${user.emailVerificationToken}`;
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'Подтвердите email для Sooli',
      html: buildWelcomeEmailHtml(user.name, confirmUrl),
    });

    const response = NextResponse.json({
      user: toPublicUser(user),
      emailSent,
      emailVerificationRequired: true,
      message: emailSent
        ? 'Проверьте почту и подтвердите email перед первым входом'
        : 'Аккаунт создан, но письмо не отправлено: проверьте SMTP-настройки сервера',
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось создать аккаунт';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
