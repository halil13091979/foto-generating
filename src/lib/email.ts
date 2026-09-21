import nodemailer from 'nodemailer';

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  const normalized = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(normalized)) return false;
  return fallback;
}

export function getSmtpEnvironment() {
  const port = Number(process.env.SMTP_PORT ?? '587');
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD?.trim();
  const service = process.env.SMTP_SERVICE?.trim();

  return {
    host,
    port,
    service,
    user,
    password,
    secure: parseBoolean(process.env.SMTP_SECURE, port === 465),
    requireTls: parseBoolean(process.env.SMTP_REQUIRE_TLS, true),
    rejectUnauthorized: parseBoolean(process.env.SMTP_TLS_REJECT_UNAUTHORIZED, true),
    from: process.env.SMTP_FROM?.trim() || user || 'no-reply@example.com',
    fromName: process.env.SMTP_FROM_NAME?.trim() || 'Sooli',
  };
}

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export function createTransport() {
  const smtp = getSmtpEnvironment();
  const { host, port, user, password, service } = smtp;

  if (!host && !service) {
    return null;
  }

  const auth = user && password ? { user, pass: password } : undefined;

  if (service) {
    return nodemailer.createTransport({
      service,
      secure: smtp.secure,
      auth,
      tls: {
        rejectUnauthorized: smtp.rejectUnauthorized,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: smtp.secure,
    requireTLS: smtp.requireTls,
    auth,
    tls: {
      rejectUnauthorized: smtp.rejectUnauthorized,
    },
  });
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const transporter = createTransport();
  if (!transporter) return false;

  try {
    const { from, fromName } = getSmtpEnvironment();
    await transporter.sendMail({
      from: `${fromName} <${from}>`,
      to: payload.to,
      subject: payload.subject,
      text: payload.text ?? payload.html.replace(/<[^>]*>/g, ' '),
      html: payload.html,
    });
    return true;
  } catch {
    return false;
  }
}

export function buildWelcomeEmailHtml(name: string, confirmUrl: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #171717; max-width: 640px; margin: 0 auto;">
      <h2 style="margin-bottom: 12px;">Добро пожаловать в Sooli</h2>
      <p>Привет, ${name}!</p>
      <p>Спасибо за регистрацию. Для активации аккаунта нажмите кнопку ниже:</p>
      <p style="margin: 24px 0;">
        <a href="${confirmUrl}" style="display: inline-block; background: #171717; color: white; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Подтвердить email</a>
      </p>
      <p>Если кнопка не работает, скопируйте ссылку:</p>
      <p><a href="${confirmUrl}">${confirmUrl}</a></p>
      <p style="margin-top: 24px; color: #687044;">Команда Sooli</p>
    </div>
  `;
}
