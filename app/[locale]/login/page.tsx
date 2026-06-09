import { LockKeyhole } from "lucide-react";
import { loginAction } from "./actions";
import { dictionaries, normalizeLocale } from "@/lib/i18n";
import { inputClass, buttonClass } from "@/components/FormControls";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; env?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const { error, env } = await searchParams;
  const locale = normalizeLocale(rawLocale);
  const t = dictionaries[locale];
  const envReady = hasSupabaseEnv();

  return (
    <main className="grid min-h-screen place-items-center bg-admin-bg px-4">
      <section className="w-full max-w-md rounded-lg border border-admin-line bg-white p-8 shadow-admin-soft">
        <div className="mb-8">
          <div className="mb-5 grid size-12 place-items-center rounded-md bg-admin-primary text-white">
            <LockKeyhole size={22} />
          </div>
          <h1 className="text-3xl font-black text-admin-graphite">{t.appName}</h1>
          <p className="mt-2 text-sm font-bold leading-6 text-admin-muted">{t.loginSubtitle}</p>
        </div>
        {error ? (
          <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            {t.loginError}
          </div>
        ) : null}
        {env || !envReady ? (
          <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
            {t.envMissing}
          </div>
        ) : null}
        <form action={loginAction} className="grid gap-4">
          <input type="hidden" name="locale" value={locale} />
          <label className="grid gap-2 text-sm font-black">
            {t.email}
            <input className={inputClass} name="email" type="email" autoComplete="email" required />
          </label>
          <label className="grid gap-2 text-sm font-black">
            {t.password}
            <input className={inputClass} name="password" type="password" autoComplete="current-password" required />
          </label>
          <button className={`${buttonClass} mt-2 w-full`} disabled={!envReady}>
            {t.signIn}
          </button>
        </form>
      </section>
    </main>
  );
}
