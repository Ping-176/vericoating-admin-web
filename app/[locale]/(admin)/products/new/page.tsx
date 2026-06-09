import { PageHeader } from "@/components/PageHeader";
import { ProductForm } from "@/components/ProductForm";
import { dictionaries, normalizeLocale } from "@/lib/i18n";
import { getDimensions } from "@/lib/admin-data";

export default async function NewProductPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale = normalizeLocale(rawLocale);
  const t = dictionaries[locale];
  const dimensions = await getDimensions();

  return (
    <>
      <PageHeader title={t.createProduct} />
      <ProductForm locale={locale} t={t} dimensions={dimensions} />
    </>
  );
}
