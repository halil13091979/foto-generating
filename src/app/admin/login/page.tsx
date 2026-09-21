'use client';

import { LockKeyhole, ShieldCheck } from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function AdminLoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const response = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const result = await response.json();
    if (response.ok) window.location.href = '/admin';
    else setError(result.error ?? 'Не удалось войти');
    setLoading(false);
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#efede8] p-5"><form onSubmit={handleSubmit} className="w-full max-w-md rounded-lg border border-black/10 bg-[#fbfaf7] p-7 shadow-[0_20px_50px_rgba(23,23,23,0.1)]"><div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#171717] text-[#c9ff4a]"><ShieldCheck className="h-6 w-6" /></div><p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#687044]">Sooli / private access</p><h1 className="mt-2 text-3xl font-black">Вход администратора</h1><p className="mt-3 text-sm leading-6 text-slate-500">Эта зона защищена. Пароль проверяется только на сервере и не сохраняется в браузере.</p><label className="mt-6 block text-sm font-semibold">Пароль администратора<div className="relative mt-2"><LockKeyhole className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input autoFocus required type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-md border border-black/10 bg-white py-3 pl-10 pr-3 outline-none focus:border-[#687044]" /></div></label>{error && <div className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">{error}</div>}<button disabled={loading} type="submit" className="mt-5 w-full rounded-md bg-[#171717] px-4 py-3 font-bold text-white disabled:opacity-50">{loading ? 'Проверяем...' : 'Войти в админ-панель'}</button></form></main>;
}
