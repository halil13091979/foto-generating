import { describe, expect, it } from 'vitest';
import { buildLoginPayload, buildRegistrationPayload } from './auth-form';

describe('auth form payloads', () => {
  it('keeps registration fields consistent and trimmed', () => {
    const form = new FormData();
    form.set('name', '  Алексей  ');
    form.set('email', '  alexey@example.com  ');
    form.set('password', '  qwerty123  ');

    expect(buildRegistrationPayload(form)).toEqual({
      name: 'Алексей',
      email: 'alexey@example.com',
      password: 'qwerty123',
    });
  });

  it('reads login credentials from form data', () => {
    const form = new FormData();
    form.set('email', 'test@example.com');
    form.set('password', 'secret123');

    expect(buildLoginPayload(form)).toEqual({
      email: 'test@example.com',
      password: 'secret123',
    });
  });
});
