import { PageHeader } from "@/components/PageHeader";
import { SkuParametersWorkspace } from "@/components/SkuParametersWorkspace";
import { getParameterDefinitions, getProductSkus, getProductSystems } from "@/lib/admin-data";
import { dictionaries, normalizeLocale } from "@/lib/i18n";

export default async function NewSkuParameterPage({
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
  const [skus, systems, parameters] = await Promise.all([getProductSkus(locale), getProductSystems(locale), getParameterDefinitions(locale)]);

  return (
    <>
      <PageHeader title={t.skuParameters} description={t.skuEditorDesc} />
      {state.saved ? <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{t.saved}</div> : null}
      {state.error ? <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">{state.error === "json" ? t.invalidJson : state.error === "copy" ? t.copyFailed : t.saveFailed}</div> : null}
      <SkuParametersWorkspace locale={locale} t={t} skus={skus} systems={systems} parameters={parameters} createMode />
    </>
  );
}
