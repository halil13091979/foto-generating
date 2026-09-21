'use client';

import {
  ArrowRight,
  Bell,
  Check,
  ChevronDown,
  CreditCard,
  Download,
  ImagePlus,
  LayoutGrid,
  Palette,
  Search,
  Sparkles,
  ShieldCheck,
  UserRound,
  Wand2,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { buildLoginPayload, buildRegistrationPayload } from '@/lib/auth-form';
import { buildMarketplacePrompt, getExportPreset } from '@/lib/marketplace-styles';
import { RAYS_PLANS, WELCOME_RAYS, estimateOperations, formatRays, type RaysOperation, type RaysPlan } from '@/lib/rays';
import type { RaysTransaction } from '@/lib/billing-store';

type RaysState = {
  balance: number;
  welcomeGranted: boolean;
};

type RaysAccountResponse = RaysState & {
  transactions?: RaysTransaction[];
};

const marketplaceOptions = ['Wildberries', 'Ozon', 'Яндекс Маркет', 'SberMarket'] as const;
const styleOptions = ['Студийный люкс', 'Редакционный премиум', 'Лайфстайл', 'Съёмка сверху', 'Минимализм'];
const templateOptions = ['Главный слайд', 'Набор товаров', 'Лайфстайл', 'Инфографика', 'Промо'];

type CardVariant = {
  id: number;
  name: string;
  score: number;
  status: 'Ready' | 'Draft';
  palette: string;
  imageUrl?: string;
};

const defaultVariants: CardVariant[] = [];

const navItems = [
  { label: 'Рабочая область', icon: LayoutGrid, active: true },
  { label: 'Шаблоны', icon: Palette },
  { label: 'Материалы', icon: ImagePlus },
  { label: 'Тариф и оплата', icon: CreditCard },
  { label: 'Личный кабинет', icon: UserRound },
];

export default function HomePage() {
  const [selectedPlatform, setSelectedPlatform] = useState<(typeof marketplaceOptions)[number]>('Wildberries');
  const [selectedStyle, setSelectedStyle] = useState(styleOptions[0]);
  const [selectedTemplate, setSelectedTemplate] = useState(templateOptions[0]);
  const [productName, setProductName] = useState('Городской рюкзак');
  const [brief, setBrief] = useState('Премиальный городской рюкзак для активного образа жизни');
  const [variants, setVariants] = useState(defaultVariants);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [notice, setNotice] = useState('');
  const [activeSection, setActiveSection] = useState('Рабочая область');
  const [selectedPlan, setSelectedPlan] = useState('studio');
  const [rays, setRays] = useState<RaysState | null>(null);
  const [transactions, setTransactions] = useState<RaysTransaction[]>([]);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const loadRays = async () => {
    try {
      const response = await fetch('/api/rays', { method: 'GET' });
      if (!response.ok) return;
      const data = (await response.json()) as { account?: RaysState };
      if (data.account) setRays({ balance: data.account.balance, welcomeGranted: data.account.welcomeGranted });
    } catch {
      // Баланс недоступен — интерфейс продолжит работать с локальными значениями.
    }
  };

  const claimWelcomeRays = async () => {
    const response = await fetch('/api/rays/welcome', { method: 'POST' });
    const data = (await response.json()) as { account?: RaysAccountResponse };
    if (data.account) {
      setRays({ balance: data.account.balance, welcomeGranted: data.account.welcomeGranted });
      setTransactions(data.account.transactions ?? []);
    }
  };

  const topUpRays = async (amount: number, description: string) => {
    const response = await fetch('/api/rays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, description }),
    });
    const data = (await response.json()) as { account?: RaysAccountResponse };
    if (data.account) {
      setRays({ balance: data.account.balance, welcomeGranted: data.account.welcomeGranted });
      setTransactions(data.account.transactions ?? []);
    }
  };

  const spendRaysOnServer = async (operation: RaysOperation, description: string): Promise<boolean> => {
    const response = await fetch('/api/rays/spend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, description }),
    });
    const data = (await response.json()) as { account?: RaysAccountResponse; error?: string };
    if (response.ok && data.account) {
      setRays({ balance: data.account.balance, welcomeGranted: data.account.welcomeGranted });
      setTransactions(data.account.transactions ?? []);
      return true;
    }
    setNotice(data.error ?? 'Не удалось списать лучи');
    return false;
  };

  useEffect(() => {
    void loadRays();
  }, []);

  const currentPreset = useMemo(() => getExportPreset(selectedPlatform), [selectedPlatform]);

  const handleGenerate = async () => {
    if (rays && rays.balance < 4) {
      setNotice('Лучи закончились. Пополните баланс, чтобы продолжить.');
      setActiveSection('Тариф и оплата');
      return;
    }

    setIsGenerating(true);
    setNotice('Создаём новую карточку...');

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        size: currentPreset.aspectRatio === '4:5' ? '1024x1536' : '1024x1024',
      }),
    });
    const data = (await response.json().catch(() => ({}))) as { imageUrl?: string; error?: string };
    if (!response.ok || !data.imageUrl) {
      setNotice(data.error ?? 'Не удалось сгенерировать изображение');
      setIsGenerating(false);
      return;
    }

    setVariants((prev) => [{
      id: Date.now(),
      name: `${selectedTemplate} · ${selectedStyle}`,
      score: 98,
      status: 'Ready',
      palette: 'from-[#262626] via-[#77766f] to-[#c9ff4a]',
      imageUrl: data.imageUrl,
    }, ...prev.slice(0, 2)]);
    setIsGenerating(false);
    setNotice('Карточка готова к проверке');
  };

  const handleRegistration = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildRegistrationPayload(new FormData(event.currentTarget));
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; emailSent?: boolean; message?: string };
    if (!response.ok) {
      setNotice(data.error ?? 'Не удалось создать аккаунт');
      return;
    }

    await loadRays();
    setShowRegistration(false);
    setNotice(data.message ?? (data.emailSent
      ? 'Проверьте почту для подтверждения аккаунта'
      : `Аккаунт создан, но письмо не отправлено`));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setRays(null);
    setTransactions([]);
    setNotice('Вы вышли из аккаунта');
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const payload = buildLoginPayload(new FormData(event.currentTarget));
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setNotice(data.error ?? 'Не удалось войти');
      return;
    }

    await loadRays();
    setShowLogin(false);
    setNotice('Вы вошли в аккаунт');
  };

  const handleBuyPlan = async (plan: RaysPlan) => {
    setSelectedPlan(plan.id);
    setNotice(`Оплата тарифа «${plan.name}» пока не подключена. Баланс не изменён.`);
  };

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(prompt);
    setNotice('Промпт скопирован');
  };

  const handleExport = () => {
    const blob = new Blob([prompt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${productName || 'sooli-card'}-prompt.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Промпт экспортирован');
  };

  const handleNewCampaign = () => {
    setProductName('Новый товар');
    setBrief('Опишите товар и желаемый результат');
    setUploadedFile(null);
    setNotice('Новая кампания создана');
  };

  const prompt = buildMarketplacePrompt({
    productName,
    category: 'Обувь и аксессуары',
    style: selectedStyle,
    background: 'Премиальная студия с тёплым светом и мягкими тенями',
    platform: selectedPlatform,
    keyBenefits: ['Удобная посадка', 'Лёгкий вес', 'Премиальная отделка'],
  });

  return (
    <main className="min-h-screen bg-[#efede8] text-[#171717]">
      <div className="mx-auto flex max-w-[1600px] gap-6 p-5 lg:p-8">
        <aside className="hidden w-[260px] shrink-0 rounded-lg bg-[#171717] p-5 text-white shadow-[0_24px_50px_rgba(23,23,23,0.18)] lg:block">
          <div className="flex items-center gap-3 pb-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-md bg-[#c9ff4a] text-lg font-black text-[#171717]">
              S
            </div>
            <div>
              <div className="text-lg font-bold">Sooli</div>
              <div className="text-xs text-slate-400">sooli.ru</div>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition ${
                  activeSection === label ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
                onClick={() => {
                  setActiveSection(label);
                  setNotice(label === 'Шаблоны' ? 'Выберите шаблон в настройках карточки' : label === 'Материалы' ? 'Добавьте референс в блоке загрузки' : label === 'Тариф и оплата' ? `Текущий баланс: ${rays ? formatRays(rays.balance) : 'загрузка...'}` : 'Рабочая область открыта');
                }}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </nav>

          <div className="mt-8 rounded-[22px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
              <span>Баланс</span>
              <span>Лучи</span>
            </div>
            <div className="mt-4 text-3xl font-black">{rays ? formatRays(rays.balance) : '—'}</div>
            <div className="mt-2 text-sm text-slate-300">{rays ? `≈ ${estimateOperations(rays.balance, 'photo-1k')} фото 1K` : 'Загрузка баланса...'}</div>
          </div>
        </aside>

        <div className="flex-1 rounded-lg border border-black/10 bg-[#fbfaf7] p-4 shadow-[0_20px_50px_rgba(23,23,23,0.08)] md:p-6">
          <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#687044]">{activeSection}</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Генерация фото товара</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 md:flex">
                <Search className="h-4 w-4" />
                Поиск материалов
              </div>
              <button type="button" onClick={() => setNotice('Новых уведомлений нет')} className="rounded-full border border-slate-200 bg-white p-2.5 text-slate-600">
                <Bell className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setActiveSection('Личный кабинет')} className="hidden items-center gap-2 rounded-md border border-black/10 bg-white px-3 py-2.5 text-sm font-semibold text-[#171717] sm:flex">
                <UserRound className="h-4 w-4" />
                Кабинет
              </button>
              <button type="button" onClick={() => setShowRegistration(true)} className="rounded-md border border-[#687044]/30 bg-[#e7edcf] px-3 py-2.5 text-sm font-semibold text-[#687044]">
                Начать бесплатно
              </button>
              <button type="button" onClick={handleNewCampaign} className="rounded-md bg-[#171717] px-4 py-2.5 text-sm font-semibold text-white">
                Новая кампания
              </button>
            </div>
          </header>

          {activeSection !== 'Рабочая область' && (
            <ManagementPanel
              section={activeSection}
              selectedPlan={selectedPlan}
              balance={rays?.balance ?? 0}
              transactions={transactions}
              onPlanSelect={(plan) => { setSelectedPlan(plan); setNotice(`Тариф ${plan} выбран`); }}
              onTemplateSelect={(template) => { setSelectedTemplate(template); setActiveSection('Рабочая область'); setNotice(`Шаблон «${template}» применён`); }}
              onAction={setNotice}
            />
          )}

          <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-6">
              <section className="rounded-lg border border-black/10 bg-[#f5f3ee] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Настройка карточки</h2>
                  <span className="rounded-md bg-[#e7edcf] px-2 py-1 text-xs font-semibold text-[#687044]">Сохраняется автоматически</span>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Название товара</label>
                    <input
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none ring-0 transition focus:border-violet-400"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">Описание задачи</label>
                    <textarea
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-violet-400"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Маркетплейс</label>
                      <div className="relative">
                        <select
                          value={selectedPlatform}
                          onChange={(e) => setSelectedPlatform(e.target.value as (typeof marketplaceOptions)[number])}
                          className="w-full appearance-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 outline-none focus:border-violet-400"
                        >
                          {marketplaceOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Формат</label>
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700">
                        {currentPreset.aspectRatio} · {currentPreset.resolution}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Стиль</label>
                      <div className="flex flex-wrap gap-2">
                        {styleOptions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setSelectedStyle(item)}
                            className={`rounded-full px-3 py-2 text-sm font-medium transition ${selectedStyle === item ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300'}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">Шаблон</label>
                      <div className="flex flex-wrap gap-2">
                        {templateOptions.map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => setSelectedTemplate(item)}
                            className={`rounded-full px-3 py-2 text-sm font-medium transition ${selectedTemplate === item ? 'bg-violet-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300'}`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-dashed border-slate-300 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Загрузка референсов</span>
                      <span className="text-xs font-medium text-violet-700">2 файла</span>
                    </div>
                    <label className="flex cursor-pointer items-center justify-center rounded-[18px] bg-slate-100 py-8 text-center text-sm text-slate-500 transition hover:bg-[#e7edcf]">
                      <input type="file" accept="image/*" className="sr-only" onChange={(event) => setUploadedFile(event.target.files?.[0]?.name ?? null)} />
                      {uploadedFile ?? 'Перетащите фото товара сюда или выберите файл'}
                    </label>
                    {uploadedFile && <div className="mt-2 text-xs font-medium text-[#687044]">Референс добавлен</div>}
                  </div>
                </div>
              </section>

              <section className="rounded-lg border border-black/10 bg-white p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Предпросмотр промпта</h2>
                  <button type="button" onClick={handleCopyPrompt} className="rounded-md bg-[#e7edcf] px-3 py-1.5 text-xs font-semibold text-[#687044]">
                    Скопировать промпт
                  </button>
                </div>
                <div className="rounded-[20px] bg-slate-950 p-4 text-sm leading-6 text-slate-200">
                  {prompt}
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-lg border border-black/10 bg-[#171717] p-5 text-white shadow-[0_24px_60px_rgba(23,23,23,0.2)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Предпросмотр</p>
                    <h2 className="mt-1 text-xl font-bold">{productName}</h2>
                  </div>
                  <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white">
                    {selectedPlatform}
                  </div>
                </div>

                <div className="mt-5 rounded-lg bg-[#292929] p-4">
                  <div className="rounded-md bg-gradient-to-br from-[#77766f] via-[#d9d6cc] to-[#c9ff4a] p-3">
                    <div className="mb-4 flex items-end justify-between">
                      <div className="rounded-[18px] bg-slate-900/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-100">
                        {selectedTemplate}
                      </div>
                      <div className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-semibold text-slate-800">
                        {currentPreset.aspectRatio}
                      </div>
                    </div>

                    <div className="flex h-56 items-end justify-between gap-4">
                      <div className="h-28 w-24 rounded-[20px] bg-slate-900/80 shadow-[0_20px_40px_rgba(15,23,42,0.35)]" />
                      <div className="h-20 w-20 rounded-full bg-violet-300/80 blur-[1px]" />
                    </div>
                  </div>

                  <div className="mt-4 rounded-[18px] bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs uppercase tracking-[0.18em] text-slate-300">Соответствие площадке</span>
                      <span className="text-sm font-semibold text-emerald-300">98%</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-200">{brief}</p>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={handleGenerate} disabled={isGenerating} className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#c9ff4a] px-4 py-3 font-semibold text-[#171717] disabled:cursor-wait disabled:opacity-60">
                    <Sparkles className="h-4 w-4" />
                    {isGenerating ? 'Генерируем...' : 'Сгенерировать'}
                  </button>
                  <button type="button" onClick={handleExport} className="rounded-full border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white">
                    Экспортировать
                  </button>
                </div>
              </section>

              <section className="rounded-lg border border-black/10 bg-[#f5f3ee] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold">Сгенерированные карточки</h2>
                  <button type="button" onClick={handleExport} className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700">
                    <Download className="h-4 w-4" />
                    Скачать набор
                  </button>
                </div>

                <div className="space-y-3">
                  {variants.map((variant) => (
                    <div key={variant.id} className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-3">
                      {variant.imageUrl ? <img src={variant.imageUrl} alt={variant.name} className="h-16 w-16 rounded-[16px] object-cover" /> : <div className={`h-16 w-16 rounded-[16px] bg-gradient-to-br ${variant.palette}`} />}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate font-semibold text-slate-800">{variant.name}</div>
                          <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${variant.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                            {variant.status === 'Ready' ? 'Готово' : 'Черновик'}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span>Качество {variant.score}%</span>
                          <span>•</span>
                          <span>{selectedPlatform}</span>
                        </div>
                      </div>
                      <button type="button" onClick={() => setNotice(`Выбрана карточка «${variant.name}»`)} className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
                        Использовать
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <section className="mt-6 rounded-lg border border-black/10 bg-[#f5f3ee] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">Сводка кампании</h2>
              <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                <Zap className="h-4 w-4 text-violet-600" />
                Показатели появятся после запуска кампании
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                { label: 'Рост CTR', value: '—', detail: 'пока не рассчитан' },
                { label: 'Средняя оценка', value: '—', detail: 'нет данных' },
                { label: 'Время готовности', value: '—', detail: 'ожидается после генерации' },
              ].map((item) => (
                <div key={item.label} className="rounded-[22px] bg-white p-4 ring-1 ring-slate-200">
                  <div className="text-sm text-slate-500">{item.label}</div>
                  <div className="mt-3 text-3xl font-black text-slate-900">{item.value}</div>
                  <div className="mt-1 text-sm text-slate-500">{item.detail}</div>
                </div>
              ))}
            </div>
          </section>
          <PricingPreview onSelect={(plan) => { setSelectedPlan(plan); setActiveSection('Тариф и оплата'); }} onBuy={handleBuyPlan} />
          {showRegistration && <RegistrationModal onClose={() => setShowRegistration(false)} onSubmit={handleRegistration} />}
          {showLogin && <LoginModal onClose={() => setShowLogin(false)} onSubmit={handleLogin} />}
          <button type="button" onClick={() => setShowLogin(true)} className="fixed bottom-5 left-44 z-10 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:text-[#687044]">Войти</button>
          <button type="button" onClick={handleLogout} className="fixed bottom-5 left-5 z-10 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm hover:text-[#687044]">Выйти</button>
          {notice && <div className="fixed bottom-5 right-5 z-10 rounded-md bg-[#171717] px-4 py-3 text-sm font-medium text-white shadow-xl">{notice}</div>}
        </div>
      </div>
    </main>
  );
}

function LoginModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-[#171717]/60 p-5"><form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-black/10 bg-[#fbfaf7] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#687044]">Sooli</p><h2 className="mt-2 text-2xl font-black">Вход в аккаунт</h2><p className="mt-2 text-sm text-slate-500">Введите email и пароль, чтобы вернуться к генерациям.</p></div><button type="button" onClick={onClose} className="text-2xl leading-none text-slate-400" aria-label="Закрыть">×</button></div><div className="mt-6 space-y-3"><input required name="email" type="email" placeholder="Email" className="w-full rounded-md border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#687044]" /><input required name="password" minLength={6} type="password" placeholder="Пароль" className="w-full rounded-md border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#687044]" /></div><button type="submit" className="mt-5 w-full rounded-md bg-[#171717] px-4 py-3 font-bold text-white">Войти</button></form></div>;
}

function PricingPreview({ onSelect, onBuy }: { onSelect: (plan: string) => void; onBuy: (plan: RaysPlan) => void }) {
  return <section className="mt-6 rounded-lg border border-black/10 bg-[#171717] p-6 text-white"><div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c9ff4a]">Прозрачные условия</p><h2 className="mt-2 text-2xl font-black">Пакеты лучей Sooli</h2></div><p className="max-w-md text-sm text-white/55">Лучи не сгорают. 4 луча — фото 1K/2K, 6 лучей — фото 4K, 16 лучей — видео 5 секунд.</p></div><div className="mt-6 grid gap-3 md:grid-cols-3">{RAYS_PLANS.map((plan) => <div key={plan.id} className={`rounded-md border p-4 ${plan.highlight ? 'border-[#c9ff4a] bg-white/10' : 'border-white/10 bg-white/5'}`}><div className="flex items-center justify-between"><span className="font-bold">{plan.name}</span>{plan.highlight && <span className="rounded-sm bg-[#c9ff4a] px-2 py-1 text-[10px] font-bold text-[#171717]">Хит</span>}</div><div className="mt-4 text-2xl font-black">{plan.price.toLocaleString('ru-RU')} ₽</div><div className="mt-2 text-xs text-white/55">{plan.rays.toLocaleString('ru-RU')} лучей · {plan.description}</div><div className="mt-4 flex gap-2"><button type="button" onClick={() => onBuy(plan)} className="flex-1 rounded-md bg-[#c9ff4a] px-3 py-2.5 text-xs font-bold text-[#171717]">Купить лучи</button><button type="button" onClick={() => onSelect(plan.id)} className="rounded-md border border-white/15 px-3 py-2.5 text-xs font-semibold text-white">Подробнее</button></div></div>)}</div></section>;
}

function RegistrationModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-5"><form onSubmit={onSubmit} className="w-full max-w-md rounded-lg bg-[#fbfaf7] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#687044]">Sooli Free</p><h2 className="mt-2 text-2xl font-black">Создать аккаунт</h2><p className="mt-2 text-sm text-slate-500">После регистрации вы получите {WELCOME_RAYS} приветственных лучей на генерации и улучшения.</p></div><button type="button" onClick={onClose} className="text-2xl leading-none text-slate-400" aria-label="Закрыть">×</button></div><div className="mt-6 space-y-3"><input required name="name" type="text" placeholder="Ваше имя" className="w-full rounded-md border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#687044]" /><input required name="email" type="email" placeholder="Email" className="w-full rounded-md border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#687044]" /><input required name="password" minLength={6} type="password" placeholder="Пароль" className="w-full rounded-md border border-black/10 bg-white px-4 py-3 outline-none focus:border-[#687044]" /></div><button type="submit" className="mt-5 w-full rounded-md bg-[#171717] px-4 py-3 font-bold text-white">Зарегистрироваться и получить {WELCOME_RAYS} лучей</button></form></div>;
}

function ManagementPanel({ section, selectedPlan, balance, transactions, onPlanSelect, onTemplateSelect, onAction }: { section: string; selectedPlan: string; balance: number; transactions: RaysTransaction[]; onPlanSelect: (plan: string) => void; onTemplateSelect: (template: string) => void; onAction: (message: string) => void }) {
  if (section === 'Личный кабинет') {
    return (
      <section className="mt-6 rounded-lg border border-black/10 bg-[#f5f3ee] p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687044]">Профиль пользователя</p>
            <h2 className="mt-2 text-2xl font-black">Личный кабинет</h2>
          </div>
          <button type="button" onClick={() => onAction('Изменения профиля сохранены')} className="rounded-md bg-[#171717] px-4 py-2.5 text-sm font-semibold text-white">Сохранить изменения</button>
        </div>
        <div className="mt-6 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-lg bg-[#171717] p-5 text-white">
            <div className="flex h-14 w-14 items-center justify-center rounded-md bg-[#c9ff4a] text-xl font-black text-[#171717]">П</div>
            <h3 className="mt-5 text-xl font-bold">Профиль не заполнен</h3>
            <p className="mt-1 text-sm text-white/60">Войдите в аккаунт, чтобы увидеть данные профиля.</p>
            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm"><span className="text-white/60">Тариф</span><strong>Не выбран</strong></div>
            <div className="mt-2 flex items-center justify-between text-sm"><span className="text-white/60">Следующее списание</span><strong>—</strong></div>
            <div className="mt-2 flex items-center justify-between text-sm"><span className="text-white/60">Баланс лучей</span><strong>{formatRays(balance)}</strong></div>
          </div>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {[['Имя', ''], ['Email', ''], ['Компания', ''], ['Роль', '']].map(([label, value]) => (
                <label key={label} className="text-sm font-semibold text-slate-700">{label}<input placeholder="Заполните поле" defaultValue={value} className="mt-2 w-full rounded-md border border-black/10 bg-white px-3 py-3 font-normal outline-none placeholder:text-slate-300 focus:border-[#687044]" /></label>
              ))}
            </div>
            <div className="rounded-lg bg-white p-5 ring-1 ring-black/10">
              <h3 className="font-bold">История транзакций</h3>
              {transactions.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Пока нет операций. После генерации или покупки пакета лучей здесь появится история.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {transactions.slice(-6).reverse().map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between border-b border-black/5 py-2 text-sm last:border-0">
                      <div>
                        <div className="font-semibold text-[#171717]">{transaction.description}</div>
                        <div className="text-xs text-slate-400">{new Date(transaction.createdAt).toLocaleString('ru-RU')}</div>
                      </div>
                      <div className={`font-bold ${transaction.amount < 0 ? 'text-red-500' : 'text-[#687044]'}`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString('ru-RU')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (section === 'Админ-панель') {
    return (
      <section className="mt-6 rounded-lg border border-black/10 bg-[#f5f3ee] p-6">
        <div className="flex items-center justify-between border-b border-black/10 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687044]">Контроль продукта</p><h2 className="mt-2 text-2xl font-black">Админ-панель</h2></div><span className="rounded-md bg-[#e7edcf] px-3 py-2 text-xs font-bold text-[#687044]">Система работает</span></div>
        <div className="mt-6 rounded-lg border border-dashed border-black/15 bg-white p-6 text-sm text-slate-500">Метрики и активность появятся после подключения аналитики, платежей и генераций.</div>
        <div className="mt-6 rounded-lg bg-white p-5 ring-1 ring-black/10"><h3 className="font-bold">Быстрые действия</h3><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => onAction('Раздел пользователей открыт')} className="rounded-md bg-[#171717] px-3 py-2 text-sm font-semibold text-white">Пользователи</button><button type="button" onClick={() => onAction('Модерация шаблонов открыта')} className="rounded-md border border-black/10 px-3 py-2 text-sm font-semibold">Модерация шаблонов</button></div></div>
      </section>
    );
  }

  if (section === 'Тариф и оплата') {
    return <section className="mt-6 rounded-lg border border-black/10 bg-[#f5f3ee] p-6"><div className="border-b border-black/10 pb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687044]">Валюта Sooli</p><h2 className="mt-2 text-2xl font-black">Лучи и пакеты</h2><p className="mt-2 text-sm text-slate-500">4 луча — фото 1K/2K, 6 лучей — фото 4K, 2 луча — улучшение, 16/32 луча — видео 5/10 секунд.</p></div><div className="mt-6 grid gap-4 lg:grid-cols-3">{RAYS_PLANS.map((plan) => <div key={plan.id} className={`rounded-lg p-5 ring-1 ${plan.id === selectedPlan ? 'bg-[#171717] text-white ring-[#171717]' : 'bg-white ring-black/10'}`}><div className="flex items-center justify-between"><h3 className="font-bold">{plan.name}</h3>{plan.id === selectedPlan && <span className="rounded-md bg-[#c9ff4a] px-2 py-1 text-[10px] font-bold text-[#171717]">Активен</span>}</div><div className="mt-6 text-3xl font-black">{plan.price.toLocaleString('ru-RU')} ₽</div><p className="mt-2 text-sm opacity-60">{plan.rays.toLocaleString('ru-RU')} лучей · {plan.description}</p><p className="mt-2 text-xs opacity-50">≈ {estimateOperations(plan.rays, 'photo-1k')} фото 1K или {estimateOperations(plan.rays, 'video-5s')} видео по 5 сек</p><button type="button" onClick={() => onPlanSelect(plan.id)} className={`mt-6 w-full rounded-md px-3 py-3 text-sm font-bold ${plan.id === selectedPlan ? 'bg-[#c9ff4a] text-[#171717]' : 'bg-[#171717] text-white'}`}>{plan.id === selectedPlan ? 'Текущий пакет' : 'Выбрать пакет'}</button></div>)}</div></section>;
  }

  const isTemplates = section === 'Шаблоны';
  return <section className="mt-6 rounded-lg border border-black/10 bg-[#f5f3ee] p-6"><div className="border-b border-black/10 pb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#687044]">Библиотека Sooli</p><h2 className="mt-2 text-2xl font-black">{isTemplates ? 'Шаблоны' : 'Материалы'}</h2><p className="mt-2 text-sm text-slate-500">{isTemplates ? 'Готовые композиции для карточек товара.' : 'Загруженные фото, референсы и готовые наборы.'}</p></div><div className="mt-6 grid gap-4 md:grid-cols-3">{(isTemplates ? ['Главный слайд', 'Набор товаров', 'Инфографика', 'Лайфстайл', 'Промо', 'Минимализм'] : ['Фото товара', 'Референсы', 'Готовые карточки']).map((item, index) => <button key={item} type="button" onClick={() => isTemplates ? onTemplateSelect(item) : onAction(`${item}: раздел открыт`)} className="group rounded-lg bg-white p-4 text-left ring-1 ring-black/10 transition hover:-translate-y-1 hover:ring-[#687044]"><div className={`h-28 rounded-md ${index % 2 ? 'bg-[#d9d6cc]' : 'bg-[#292929]'}`} /><div className="mt-4 font-bold">{item}</div><div className="mt-1 text-sm text-slate-500">{isTemplates ? 'Применить к генерации' : 'Раздел ещё не подключён'}</div></button>)}</div></section>;
}
