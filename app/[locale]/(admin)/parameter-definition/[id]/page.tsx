import { redirect } from "next/navigation";
import { normalizeLocale } from "@/lib/i18n";

export default async function ParameterDefinitionRedirectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  redirect(`/${normalizeLocale(rawLocale)}/parameter-definition`);
}
