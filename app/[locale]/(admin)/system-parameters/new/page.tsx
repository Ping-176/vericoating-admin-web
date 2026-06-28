import { PageHeader } from "@/components/PageHeader";
import { SystemParametersWorkspace } from "@/components/SystemParametersWorkspace";
import { getParameterDefinitions, getProductSystems } from "@/lib/admin-data";
import { dictionaries, normalizeLocale } from "@/lib/i18n";

export default async function NewSystemParameterPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const state = await searchParams;
  const locale = normalizeLocale(rawLocale);
  const t = dictionaries[locale];
  const [systems, parameters] = await Promise.all([getProductSystems(locale), getParameterDefinitions(locale)]);

  return (
    <>
      <PageHeader title={t.systemParameters} description={t.systemEditorDesc} />
      {state.saved ? <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{t.saved}</div> : null}
      {state.error ? <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{state.error === "json" ? t.invalidJson : state.error === "copy" ? t.copyFailed : t.saveFailed}</div> : null}
      <SystemParametersWorkspace locale={locale} t={t} systems={systems} parameters={parameters} createMode />
    </>
  );
}
