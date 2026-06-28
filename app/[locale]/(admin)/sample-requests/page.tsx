import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { inputClass, secondaryButtonClass } from "@/components/FormControls";
import { dictionaries, normalizeLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { getSampleRequests, getSkuOptions } from "@/lib/admin-data";

const statuses = ["new", "technical_review", "preparing_sample", "dispatched", "completed", "cancelled"];

export default async function SampleRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { locale: rawLocale } = await params;
  const filters = await searchParams;
  const locale = normalizeLocale(rawLocale);
  const t = dictionaries[locale];
  const [skus, result] = await Promise.all([getSkuOptions(locale), getSampleRequests(filters, locale)]);

  return (
    <>
      <PageHeader title={t.sampleRequests} />

      <form className="mb-5 grid gap-3 rounded-lg border border-admin-line bg-white p-4 shadow-admin-soft md:grid-cols-4">
        <input className={inputClass} name="search" placeholder={t.search} defaultValue={filters.search ?? ""} />
        <select className={inputClass} name="status" defaultValue={filters.status ?? ""}>
          <option value="">{t.status}: {t.all}</option>
          {statuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <select className={inputClass} name="product" defaultValue={filters.product ?? ""}>
          <option value="">{t.product}: {t.all}</option>
          {skus.map((sku) => (
            <option key={sku.id} value={sku.id}>
              {sku.sku_code} · {sku.name}
            </option>
          ))}
        </select>
        <button className={secondaryButtonClass}>{t.search}</button>
      </form>

      {result.error ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          {t.tableMissing}
        </div>
      ) : (
        <section className="overflow-hidden rounded-lg border border-admin-line bg-white shadow-admin-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left">
              <thead className="bg-admin-primary text-xs font-black uppercase text-white">
                <tr>
                  <th className="px-4 py-3">{t.requestNo}</th>
                  <th className="px-4 py-3">{t.product}</th>
                  <th className="px-4 py-3">{t.company}</th>
                  <th className="px-4 py-3">{t.contact}</th>
                  <th className="px-4 py-3">{t.email}</th>
                  <th className="px-4 py-3">{t.country}</th>
                  <th className="px-4 py-3">{t.sampleSpec}</th>
                  <th className="px-4 py-3">{t.status}</th>
                  <th className="px-4 py-3">{t.createdAt}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-line">
                {result.rows.map((request) => (
                  <tr key={request.id} className="hover:bg-admin-bg">
                    <td className="px-4 py-4">
                      <Link href={`/${locale}/sample-requests/${request.id}`} className="font-black text-admin-primary hover:underline">
                        {request.request_no}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">{request.sku?.name ?? "-"}</td>
                    <td className="px-4 py-4 text-sm font-bold">{request.company}</td>
                    <td className="px-4 py-4 text-sm font-bold">{request.contact_name}</td>
                    <td className="px-4 py-4 text-sm font-bold">{request.email}</td>
                    <td className="px-4 py-4 text-sm font-bold">{request.country ?? "-"}</td>
                    <td className="px-4 py-4 text-sm font-bold">{request.sample_spec ?? "-"}</td>
                    <td className="px-4 py-4"><StatusBadge value={request.status} /></td>
                    <td className="px-4 py-4 text-sm font-bold text-admin-muted">{formatDate(request.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!result.rows.length ? <p className="p-8 text-center text-sm font-bold text-admin-muted">{t.empty}</p> : null}
        </section>
      )}
    </>
  );
}
