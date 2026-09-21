export type LoginPayload = {
  email: string;
  password: string;
};

export type RegistrationPayload = {
  name: string;
  email: string;
  password: string;
  company?: string;
  role?: string;
};

function readTrimmed(form: FormData, field: string): string {
  return (form.get(field)?.toString() ?? '').trim();
}

export function buildLoginPayload(form: FormData): LoginPayload {
  return {
    email: readTrimmed(form, 'email'),
    password: readTrimmed(form, 'password'),
  };
}

export function buildRegistrationPayload(form: FormData): RegistrationPayload {
  const payload: RegistrationPayload = {
    name: readTrimmed(form, 'name'),
    email: readTrimmed(form, 'email'),
    password: readTrimmed(form, 'password'),
  };

  const company = readTrimmed(form, 'company');
  if (company) payload.company = company;

  const role = readTrimmed(form, 'role');
  if (role) payload.role = role;

  return payload;
}
