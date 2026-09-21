import { describe, expect, it } from 'vitest';
import { buildWelcomeEmailHtml } from './email';

describe('email helpers', () => {
  it('builds a welcome confirmation email with a valid link', () => {
    const html = buildWelcomeEmailHtml('Алексей', 'https://example.com/confirm/abc123');
    expect(html).toContain('Добро пожаловать в Sooli');
    expect(html).toContain('https://example.com/confirm/abc123');
  });
});
