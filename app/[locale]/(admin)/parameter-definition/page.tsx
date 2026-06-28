import { PageHeader } from "@/components/PageHeader";
import { ParameterDefinitionWorkspace } from "@/components/ParameterDefinitionWorkspace";
import { dictionaries, normalizeLocale } from "@/lib/i18n";
import { getParameterDefinitions } from "@/lib/admin-data";

export default async function ParameterDefinitionPage({
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
  const parameters = await getParameterDefinitions(locale);

  return (
    <>
      <PageHeader title={t.parameterDefinition} description={t.parameterDefinitionDesc} />
      {state.saved ? <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{t.saved}</div> : null}
      {state.error ? (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {state.error === "referenced" ? t.parameterReferenced : state.error === "copy" ? t.copyFailed : t.saveFailed}
        </div>
      ) : null}
      <ParameterDefinitionWorkspace locale={locale} t={t} parameters={parameters} />
    </>
  );
}
