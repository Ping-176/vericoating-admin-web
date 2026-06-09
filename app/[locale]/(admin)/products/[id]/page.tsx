import { notFound } from "next/navigation";
import { PageHeader } from "@/components/PageHeader";
import { ProductForm } from "@/components/ProductForm";
import { dictionaries, normalizeLocale } from "@/lib/i18n";
import { getDimensions, getProduct } from "@/lib/admin-data";

export default async function ProductDetailPage({
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
  const [dimensions, product] = await Promise.all([getDimensions(), getProduct(id)]);

  if (!product) notFound();

  return (
    <>
      <PageHeader title={`${t.edit}: ${product.name_en}`} />
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
      <ProductForm locale={locale} t={t} product={product} dimensions={dimensions} />
    </>
  );
}
