import Link from "next/link";
import { Trash2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { inputClass, buttonClass, secondaryButtonClass } from "@/components/FormControls";
import { deleteDimensionAction, saveDimensionAction } from "./actions";
import { dimensionTables, getDimensions, type DimensionTable } from "@/lib/admin-data";
import { dictionaries, normalizeLocale } from "@/lib/i18n";

const tableLabels: Record<DimensionTable, keyof typeof dictionaries.zh> = {
  categories: "category",
  applications: "application",
  finishes: "finish",
  glosses: "gloss",
};

export default async function DimensionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string; saved?: string; error?: string }>;
}) {
  const { locale: rawLocale } = await params;
  const state = await searchParams;
  const locale = normalizeLocale(rawLocale);
  const t = dictionaries[locale];
  const active = dimensionTables.includes(state.type as DimensionTable) ? (state.type as DimensionTable) : "categories";
  const dimensions = await getDimensions();

  return (
    <>
      <PageHeader title={t.dimensions} />
      {state.saved ? (
        <div className="mb-5 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          {t.saved}
        </div>
      ) : null}
      {state.error ? (
        <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
          {t.saveFailed}
        </div>
      ) : null}

      <div className="mb-5 flex flex-wrap gap-2">
        {dimensionTables.map((table) => (
          <Link
            key={table}
            href={`/${locale}/dimensions?type=${table}`}
            className={`rounded-md border px-4 py-2 text-sm font-black ${
              table === active
                ? "border-admin-primary bg-admin-primary !text-white hover:!text-white"
                : "border-admin-line bg-white text-admin-primary hover:bg-admin-bg"
            }`}
          >
            {t[tableLabels[table]]}
          </Link>
        ))}
      </div>

      <section className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
        <h2 className="mb-4 text-lg font-black">{t.create}</h2>
        <form action={saveDimensionAction} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_120px_auto]">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="table" value={active} />
          <input className={inputClass} name="code" placeholder={t.code} required />
          <input className={inputClass} name="name_en" placeholder={t.nameEn} required />
          <input className={inputClass} name="name_zh" placeholder={t.nameZh} />
          <input className={inputClass} name="sort" type="number" placeholder={t.sort} defaultValue={0} />
          <button className={buttonClass}>{t.create}</button>
        </form>
      </section>

      <section className="mt-5 overflow-hidden rounded-lg border border-admin-line bg-white shadow-admin-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left">
            <thead className="bg-admin-primary text-xs font-black uppercase text-white">
              <tr>
                <th className="px-4 py-3">{t.code}</th>
                <th className="px-4 py-3">{t.nameEn}</th>
                <th className="px-4 py-3">{t.nameZh}</th>
                <th className="px-4 py-3">{t.sort}</th>
                <th className="px-4 py-3">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-line">
              {dimensions[active].map((item) => (
                <tr key={item.id}>
                  <td colSpan={5} className="px-4 py-3">
                    <form action={saveDimensionAction} className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_120px_auto_auto]">
                      <input type="hidden" name="locale" value={locale} />
                      <input type="hidden" name="table" value={active} />
                      <input type="hidden" name="id" value={item.id} />
                      <input className={inputClass} name="code" defaultValue={item.code} required />
                      <input className={inputClass} name="name_en" defaultValue={item.name_en} required />
                      <input className={inputClass} name="name_zh" defaultValue={item.name_zh ?? ""} />
                      <input className={inputClass} name="sort" type="number" defaultValue={item.sort} />
                      <button className={secondaryButtonClass}>{t.save}</button>
                      <button
                        formAction={deleteDimensionAction}
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-rose-200 bg-rose-50 px-3 text-rose-700"
                        title={t.delete}
                      >
                        <Trash2 size={16} />
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!dimensions[active].length ? <p className="p-8 text-center text-sm font-bold text-admin-muted">{t.empty}</p> : null}
      </section>
    </>
  );
}
