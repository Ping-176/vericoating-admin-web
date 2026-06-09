import { AdminFrame } from "@/components/AdminFrame";
import { dictionaries, type Locale } from "@/lib/i18n";

export function AppShell({
  locale,
  email,
  children,
}: {
  locale: Locale;
  email: string | undefined;
  children: React.ReactNode;
}) {
  const t = dictionaries[locale];

  return (
    <AdminFrame locale={locale} t={t} email={email}>
      {children}
    </AdminFrame>
  );
}
