import { redirect } from "next/navigation";
import { normalizeLocale } from "@/lib/i18n";

export default async function LocaleHomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${normalizeLocale(locale)}/dashboard`);
}
