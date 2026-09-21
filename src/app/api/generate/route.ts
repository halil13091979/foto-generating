import { NextResponse } from 'next/server';
import { findUserById, getSession } from '@/lib/auth-store';
import { refundRays, spendRays } from '@/lib/billing-store';
import { readSessionToken } from '@/lib/session-cookie';

const IMAGE_COST = 4;

async function getAccountId(request: Request): Promise<string | null> {
  const session = await getSession(readSessionToken(request));
  if (!session) return null;
  const user = await findUserById(session.userId);
  return user?.accountId ?? null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const accountId = await getAccountId(request);
  if (!accountId) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    prompt?: unknown;
    size?: unknown;
  };
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return NextResponse.json({ error: 'Промпт не может быть пустым' }, { status: 400 });
  }

  const apiKey = process.env.AI_API_KEY;
  const provider = (process.env.AI_IMAGE_PROVIDER ?? process.env.AI_PROVIDER ?? 'openai').toLowerCase();
  if (provider !== 'openai' || !apiKey || apiKey.includes('your_') || apiKey.includes('placeholder')) {
    return NextResponse.json({ error: 'AI-провайдер изображений ещё не настроен на сервере' }, { status: 503 });
  }

  try {
    await spendRays(accountId, 'photo-1k', 'Генерация изображения');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Недостаточно лучей';
    return NextResponse.json({ error: message }, { status: 402 });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.AI_IMAGE_MODEL ?? 'gpt-image-1',
        prompt,
        size: body.size === '1024x1536' || body.size === '1536x1024' ? body.size : '1024x1024',
        n: 1,
      }),
    });

    const data = (await response.json().catch(() => ({}))) as {
      data?: Array<{ url?: string; b64_json?: string }>;
      error?: { message?: string };
    };
    if (!response.ok || !data.data?.[0]) {
      throw new Error(data.error?.message || 'AI-провайдер не вернул изображение');
    }

    const image = data.data[0];
    const imageUrl = image.url ?? (image.b64_json ? `data:image/png;base64,${image.b64_json}` : null);
    if (!imageUrl) throw new Error('AI-провайдер вернул пустой результат');

    return NextResponse.json({ imageUrl, chargedRays: IMAGE_COST });
  } catch (error) {
    await refundRays(accountId, 'photo-1k', 'Возврат за неудачную генерацию');
    const message = error instanceof Error ? error.message : 'Не удалось сгенерировать изображение';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}