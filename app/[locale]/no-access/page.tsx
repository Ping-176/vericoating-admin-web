import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { dictionaries, normalizeLocale } from "@/lib/i18n";
import { secondaryButtonClass } from "@/components/FormControls";

export default async function NoAccessPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = dictionaries[locale];

  return (
    <main className="grid min-h-screen place-items-center bg-admin-bg px-4">
      <section className="w-full max-w-lg rounded-lg border border-admin-line bg-white p-8 text-center shadow-admin-soft">
        <div className="mx-auto mb-5 grid size-14 place-items-center rounded-md bg-rose-50 text-rose-700">
          <ShieldAlert size={28} />
        </div>
        <h1 className="text-3xl font-black">{t.noAccess}</h1>
        <p className="mt-3 text-sm font-bold leading-6 text-admin-muted">{t.noAccessDesc}</p>
        <Link href={`/${locale}/login`} className={`${secondaryButtonClass} mt-7`}>
          {t.signIn}
        </Link>
      </section>
    </main>
  );
}
