import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { Field, buttonClass, secondaryButtonClass, textareaClass, inputClass } from "@/components/FormControls";
import { updateSampleRequestAction } from "../actions";
import { dictionaries, normalizeLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { getSampleRequest } from "@/lib/admin-data";

const statuses = ["new", "technical_review", "preparing_sample", "dispatched", "completed", "cancelled"];

export default async function SampleRequestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { locale: rawLocale, id } = await params;
  const state = await searchParams;
  const locale = normalizeLocale(rawLocale);
  const t = dictionaries[locale];
  const { row, error } = await getSampleRequest(id);

  if (error) {
    return (
      <>
        <PageHeader title={t.sampleRequests} />
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          {t.tableMissing}
        </div>
      </>
    );
  }

  if (!row) notFound();

  const details = [
    [t.product, `${row.products?.legacy_id ?? "-"} · ${row.products?.name_en ?? "-"}`],
    [t.company, row.company],
    [t.contact, row.contact_name],
    [t.email, row.email],
    [t.country, row.country],
    [t.phone, row.phone],
    [t.address, row.address],
    [t.sampleSpec, row.sample_spec],
    [t.usage, row.usage],
    [t.courier, row.courier],
    [t.testingConditions, row.testing_conditions],
    [t.notes, row.notes],
    [t.createdAt, formatDate(row.created_at)],
    [t.updatedAt, formatDate(row.updated_at)],
  ];

  return (
    <>
      <PageHeader title={`${t.requestNo}: ${row.request_no}`} />
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

      <section className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <article className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
          <h2 className="mb-5 text-lg font-black">{t.sampleRequests}</h2>
          <dl className="grid gap-0 border-t border-admin-line md:grid-cols-2">
            {details.map(([label, value]) => (
              <div key={label} className="border-b border-admin-line py-4 md:px-4">
                <dt className="text-xs font-black uppercase text-admin-muted">{label}</dt>
                <dd className="mt-2 whitespace-pre-wrap text-sm font-bold leading-6">{value || "-"}</dd>
              </div>
            ))}
          </dl>
        </article>

        <form action={updateSampleRequestAction} className="h-fit rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="id" value={row.id} />
          <h2 className="mb-5 text-lg font-black">{t.edit}</h2>
          <div className="grid gap-4">
            <Field label={t.status}>
              <select className={inputClass} name="status" defaultValue={row.status}>
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t.adminNote}>
              <textarea className={textareaClass} name="admin_note" defaultValue={row.admin_note ?? ""} />
            </Field>
            <div className="flex justify-end gap-3">
              <Link href={`/${locale}/sample-requests`} className={secondaryButtonClass}>
                {t.back}
              </Link>
              <button className={buttonClass}>{t.save}</button>
            </div>
          </div>
        </form>
      </section>
    </>
  );
}
