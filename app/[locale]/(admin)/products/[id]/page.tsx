import { redirect } from "next/navigation";
import { normalizeLocale } from "@/lib/i18n";

export default async function ProductRedirectPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale: rawLocale, id } = await params;
  redirect(`/${normalizeLocale(rawLocale)}/sku-parameters/${id}`);
}
