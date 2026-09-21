'use client';

import { Activity, ArrowLeft, BarChart3, CreditCard, Database, LayoutDashboard, LogOut, Settings, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const metrics: [string, string, string][] = [];

const activity: [string, string, string][] = [];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('Обзор');
  const [notice, setNotice] = useState('');

  return (
    <main className="min-h-screen bg-[#efede8] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-6 p-5 lg:p-8">
        <aside className="hidden w-[250px] shrink-0 rounded-lg bg-[#171717] p-5 text-white lg:block">
          <div className="flex items-center gap-3 border-b border-white/10 pb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#c9ff4a] font-black text-[#171717]">S</div>
            <div><div className="font-bold">Sooli</div><div className="text-xs text-white/50">Админ-центр</div></div>
          </div>
          <nav className="mt-6 space-y-2">
            {[
              ['Обзор', LayoutDashboard], ['Пользователи', Users], ['Генерации', Activity], ['Платежи', CreditCard], ['Контент', Database], ['Настройки', Settings],
            ].map(([label, Icon]) => (
              <button key={label as string} type="button" onClick={() => setActiveTab(label as string)} className={`flex w-full items-center gap-3 rounded-md px-3 py-3 text-left text-sm font-semibold ${activeTab === label ? 'bg-white/10 text-white' : 'text-white/55 hover:bg-white/5 hover:text-white'}`}>
                <Icon className="h-4 w-4" />{label as string}
              </button>
            ))}
          </nav>
          <Link href="/" className="mt-8 flex items-center gap-2 border-t border-white/10 pt-5 text-sm text-white/60 hover:text-white"><ArrowLeft className="h-4 w-4" />Вернуться в Sooli</Link>
        </aside>

        <section className="min-w-0 flex-1 rounded-lg border border-black/10 bg-[#fbfaf7] p-5 shadow-[0_20px_50px_rgba(23,23,23,0.08)] md:p-8">
          <header className="flex flex-col justify-between gap-5 border-b border-black/10 pb-6 md:flex-row md:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#687044]">Sooli / {activeTab}</p><h1 className="mt-2 text-3xl font-black">Центр управления</h1><p className="mt-2 text-sm text-slate-500">Контроль пользователей, генераций, тарифов и контента.</p></div>
            <div className="flex items-center gap-3"><span className="hidden items-center gap-2 rounded-md bg-[#e7edcf] px-3 py-2 text-xs font-bold text-[#687044] sm:flex"><ShieldCheck className="h-4 w-4" /> Система работает</span><button type="button" onClick={async () => { await fetch('/api/admin/logout', { method: 'POST' }); window.location.href = '/admin/login'; }} className="rounded-md border border-black/10 bg-white p-2.5 text-slate-600" aria-label="Выйти"><LogOut className="h-4 w-4" /></button></div>
          </header>

          {activeTab === 'Настройки' && <AdminSettings onNotice={setNotice} />}
          {activeTab === 'Пользователи' && <AdminUsers onNotice={setNotice} />}

          <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {metrics.length === 0 ? (
              <div className="rounded-lg border border-dashed border-black/15 bg-white p-6 text-sm text-slate-500 md:col-span-2 xl:col-span-4">Метрики появятся после подключения аналитики и внешних сервисов.</div>
            ) : metrics.map(([label, value, trend]) => <div key={label} className="rounded-lg border border-black/10 bg-white p-5"><div className="text-sm text-slate-500">{label}</div><div className="mt-3 text-2xl font-black">{value}</div><div className="mt-2 text-xs font-bold text-[#687044]">{trend} к прошлому периоду</div></div>)}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-lg border border-black/10 bg-[#f5f3ee] p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-black">Активность платформы</h2><p className="mt-1 text-sm text-slate-500">Последние события в системе</p></div><BarChart3 className="h-5 w-5 text-[#687044]" /></div>{activity.length === 0 ? <div className="mt-5 rounded-lg border border-dashed border-black/15 bg-white p-6 text-sm text-slate-500">События будут отображаться после запуска интеграций и генераций.</div> : <div className="mt-5 space-y-1">{activity.map(([time, event, actor]) => <div key={`${time}-${event}`} className="grid grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-black/5 py-3 text-sm last:border-0"><span className="text-xs text-slate-400">{time}</span><span className="font-semibold">{event}</span><span className="text-right text-slate-500">{actor}</span></div>)}</div>}</section>
            <section className="rounded-lg border border-black/10 bg-[#171717] p-5 text-white"><h2 className="text-lg font-black">Состояние сервисов</h2><div className="mt-5 rounded-lg border border-dashed border-white/15 bg-white/5 p-5 text-sm text-white/70">Мониторинг сервисов ещё не подключён. После настройки интеграций здесь появятся живые статусы.</div><button type="button" onClick={() => setNotice('Отчёт о состоянии сервисов сформирован')} className="mt-7 w-full rounded-md bg-[#c9ff4a] px-4 py-3 text-sm font-bold text-[#171717]">Сформировать отчёт</button></section>
          </div>
          {notice && <div className="fixed bottom-5 right-5 rounded-md bg-[#171717] px-4 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}
        </section>
      </div>
    </main>
  );
}

function AdminSettings({ onNotice }: { onNotice: (message: string) => void }) {
  const [provider, setProvider] = useState('OpenAI');
  const [maintenance, setMaintenance] = useState(false);
  const [monthlyLimit, setMonthlyLimit] = useState('250');

  return (
    <section className="mt-7 rounded-lg border border-black/10 bg-[#f5f3ee] p-5">
      <div className="border-b border-black/10 pb-5"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#687044]">Конфигурация сервера</p><h2 className="mt-2 text-2xl font-black">Настройки платформы</h2><p className="mt-2 max-w-2xl text-sm text-slate-500">Секретные значения хранятся на сервере и никогда не показываются полностью в браузере. Для production лучше сохранять их в защищённом хранилище, а не в localStorage.</p></div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <div className="space-y-4 rounded-lg bg-white p-5 ring-1 ring-black/10"><h3 className="font-bold">AI-провайдеры</h3><label className="block text-sm font-semibold text-slate-700">Провайдер изображений<select value={provider} onChange={(event) => setProvider(event.target.value)} className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 font-normal outline-none focus:border-[#687044]"><option>OpenAI</option><option>Replicate</option><option>Stability AI</option></select></label><label className="block text-sm font-semibold text-slate-700">API-ключ<input type="password" placeholder="sk-••••••••••••••••••••" className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 font-normal outline-none focus:border-[#687044]" /></label><label className="block text-sm font-semibold text-slate-700">Webhook secret<input type="password" placeholder="whsec-••••••••••••••••" className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 font-normal outline-none focus:border-[#687044]" /></label><button type="button" onClick={() => onNotice(`Подключение к ${provider} проверено`)} className="rounded-md border border-black/10 px-4 py-2.5 text-sm font-bold">Проверить подключение</button></div>
        <div className="space-y-4 rounded-lg bg-white p-5 ring-1 ring-black/10"><h3 className="font-bold">Ограничения и режимы</h3><label className="block text-sm font-semibold text-slate-700">Лимит Free в месяц<input value={monthlyLimit} onChange={(event) => setMonthlyLimit(event.target.value.replace(/\D/g, ''))} inputMode="numeric" className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 font-normal outline-none focus:border-[#687044]" /></label><label className="flex items-center justify-between rounded-md border border-black/10 p-3 text-sm font-semibold">Режим обслуживания<input type="checkbox" checked={maintenance} onChange={(event) => setMaintenance(event.target.checked)} className="h-5 w-5 accent-[#687044]" /></label><label className="flex items-center justify-between rounded-md border border-black/10 p-3 text-sm font-semibold">Разрешить новые регистрации<input type="checkbox" defaultChecked className="h-5 w-5 accent-[#687044]" /></label><div className="rounded-md bg-[#e7edcf] p-3 text-xs leading-5 text-[#687044]">Переменные `.env`: AI_API_KEY, AI_PROVIDER, STORAGE_BUCKET, STRIPE_SECRET_KEY. Значения применяются только на сервере после сохранения.</div><button type="button" onClick={() => onNotice(`Настройки сохранены: лимит Free ${monthlyLimit}`)} className="w-full rounded-md bg-[#171717] px-4 py-3 text-sm font-bold text-white">Сохранить настройки</button></div>
      </div>
    </section>
  );
}

function AdminUsers({ onNotice }: { onNotice: (message: string) => void }) {
  const [users, setUsers] = useState<{ name: string; email: string; plan: string; blocked: boolean }[]>([]);

  const toggleUser = (email: string) => {
    setUsers((current) => current.map((user) => user.email === email ? { ...user, blocked: !user.blocked } : user));
    const user = users.find((item) => item.email === email);
    onNotice(user?.blocked ? `Доступ ${user.name} восстановлен` : `Пользователь ${user?.name} заблокирован`);
  };

  return <section className="mt-7 rounded-lg border border-black/10 bg-[#f5f3ee] p-5"><div className="flex items-center justify-between border-b border-black/10 pb-5"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#687044]">Доступ и роли</p><h2 className="mt-2 text-2xl font-black">Пользователи</h2></div><span className="text-sm text-slate-500">{users.length} аккаунтов</span></div><div className="mt-5 overflow-x-auto">{users.length === 0 ? <div className="rounded-lg border border-dashed border-black/15 bg-white p-8 text-center text-sm text-slate-500">Пользователи появятся здесь после подключения API.</div> : <table className="w-full min-w-[620px] text-left text-sm"><thead className="text-xs uppercase tracking-wider text-slate-500"><tr><th className="pb-3">Пользователь</th><th className="pb-3">Тариф</th><th className="pb-3">Статус</th><th className="pb-3 text-right">Действие</th></tr></thead><tbody>{users.map((user) => <tr key={user.email} className="border-t border-black/10"><td className="py-4"><div className="font-bold">{user.name}</div><div className="text-xs text-slate-500">{user.email}</div></td><td className="py-4">{user.plan}</td><td className="py-4"><span className={`rounded-md px-2 py-1 text-xs font-bold ${user.blocked ? 'bg-red-100 text-red-700' : 'bg-[#e7edcf] text-[#687044]'}`}>{user.blocked ? 'Заблокирован' : 'Активен'}</span></td><td className="py-4 text-right"><button type="button" onClick={() => toggleUser(user.email)} className="rounded-md border border-black/10 bg-white px-3 py-2 text-xs font-bold">{user.blocked ? 'Разблокировать' : 'Заблокировать'}</button></td></tr>)}</tbody></table>}</div></section>;
}
