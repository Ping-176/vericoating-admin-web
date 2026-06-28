import Link from "next/link";
import { AlertTriangle, FlaskConical, PackageSearch } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { dictionaries, normalizeLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { getDashboardData } from "@/lib/admin-data";

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = dictionaries[locale];
  const { skus, sampleRequests, sampleRequestsError } = await getDashboardData(locale);

  const published = skus.filter((sku) => sku.status === "published").length;
  const draft = skus.filter((sku) => sku.status === "draft").length;
  const archived = skus.filter((sku) => sku.status === "archived").length;
  const sampleEnabled = skus.filter((sku) => sku.sample_available).length;
  const newRequests = sampleRequests.filter((request) => request.status === "new").length;
  const reviewRequests = sampleRequests.filter((request) => request.status === "technical_review").length;
  const missingDocs = skus.filter((sku) => {
    const docs = sku.certifications ?? [];
    return !docs.length;
  });

  const cards = [
    { label: t.totalProducts, value: skus.length, icon: PackageSearch },
    { label: t.publishedProducts, value: published, icon: PackageSearch },
    { label: t.draftProducts, value: draft, icon: PackageSearch },
    { label: t.archivedProducts, value: archived, icon: PackageSearch },
    { label: t.sampleEnabledProducts, value: sampleEnabled, icon: FlaskConical },
    { label: t.newSampleRequests, value: newRequests, icon: FlaskConical },
    { label: t.reviewSampleRequests, value: reviewRequests, icon: FlaskConical },
    { label: t.missingDocuments, value: missingDocs.length, icon: AlertTriangle },
  ];

  return (
    <>
      <PageHeader title={t.dashboard} description="Catalog and sample request operations overview." />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
              <div className="mb-5 flex items-center justify-between">
                <span className="text-sm font-black text-admin-muted">{card.label}</span>
                <Icon className="text-admin-accent-deep" size={20} />
              </div>
              <strong className="text-4xl font-black text-admin-primary">{card.value}</strong>
            </article>
          );
        })}
      </section>

      <section className="mt-7 grid gap-6 xl:grid-cols-2">
        <article className="rounded-lg border border-admin-line bg-white shadow-admin-soft">
          <div className="border-b border-admin-line px-5 py-4">
            <h2 className="text-lg font-black">{t.latestSampleRequests}</h2>
          </div>
          {sampleRequestsError ? (
            <p className="p-5 text-sm font-bold text-amber-700">{t.tableMissing}</p>
          ) : sampleRequests.length ? (
            <div className="divide-y divide-admin-line">
              {sampleRequests.map((request) => (
                <Link
                  key={request.id}
                  href={`/${locale}/sample-requests/${request.id}`}
                  className="grid gap-2 px-5 py-4 hover:bg-admin-bg md:grid-cols-[1fr_auto]"
                >
                  <div>
                    <strong className="text-sm font-black">{request.request_no}</strong>
                    <p className="mt-1 text-xs font-bold text-admin-muted">
                      {request.company} · {request.sku?.name ?? "-"}
                    </p>
                  </div>
                  <StatusBadge value={request.status} />
                </Link>
              ))}
            </div>
          ) : (
            <p className="p-5 text-sm font-bold text-admin-muted">{t.empty}</p>
          )}
        </article>

        <article className="rounded-lg border border-admin-line bg-white shadow-admin-soft">
          <div className="border-b border-admin-line px-5 py-4">
            <h2 className="text-lg font-black">{t.recentProducts}</h2>
          </div>
          <div className="divide-y divide-admin-line">
            {skus.slice(0, 6).map((sku) => (
              <Link
                key={sku.id}
                href={`/${locale}/sku-parameters/${sku.id}`}
                className="grid gap-2 px-5 py-4 hover:bg-admin-bg md:grid-cols-[1fr_auto]"
              >
                <div>
                  <strong className="text-sm font-black">{sku.name}</strong>
                  <p className="mt-1 text-xs font-bold text-admin-muted">
                    {sku.sku_code} · {formatDate(sku.updated_at)}
                  </p>
                </div>
                <StatusBadge value={sku.status} />
              </Link>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
