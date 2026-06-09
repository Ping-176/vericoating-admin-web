import { AppShell } from "@/components/AppShell";
import { getAdmin } from "@/lib/auth";
import { normalizeLocale } from "@/lib/i18n";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const { user } = await getAdmin(locale);

  return (
    <AppShell locale={locale} email={user.email}>
      {children}
    </AppShell>
  );
}
