import Link from 'next/link';

type VerifyEmailPageProps = {
  searchParams: { status?: string };
};

export default function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const success = searchParams.status === 'success';

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#efede8] p-5 text-[#171717]">
      <section className="w-full max-w-lg rounded-lg border border-black/10 bg-[#fbfaf7] p-8 text-center shadow-[0_20px_50px_rgba(23,23,23,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md bg-[#c9ff4a] text-xl font-black">S</div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#687044]">Sooli</p>
        <h1 className="mt-3 text-3xl font-black">{success ? 'Email подтверждён' : 'Ссылка недействительна'}</h1>
        <p className="mt-4 text-sm leading-6 text-slate-500">
          {success
            ? 'Теперь можно войти в аккаунт и пользоваться генерацией изображений.'
            : 'Ссылка уже использована, устарела или была повреждена. Запросите новое письмо при необходимости.'}
        </p>
        <Link href="/" className="mt-7 inline-flex rounded-md bg-[#171717] px-5 py-3 text-sm font-bold text-white">
          Вернуться в Sooli
        </Link>
      </section>
    </main>
  );
}