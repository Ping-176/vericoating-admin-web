import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { inputClass, buttonClass, secondaryButtonClass } from "@/components/FormControls";
import { dictionaries, normalizeLocale } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { getDimensions, getProducts } from "@/lib/admin-data";

export default async function ProductsPage({
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
  const [dimensions, products] = await Promise.all([getDimensions(), getProducts(filters)]);

  return (
    <>
      <PageHeader
        title={t.products}
        action={
          <Link href={`/${locale}/products/new`} className={buttonClass}>
            <Plus size={16} />
            {t.createProduct}
          </Link>
        }
      />

      <form className="mb-5 grid gap-3 rounded-lg border border-admin-line bg-white p-4 shadow-admin-soft md:grid-cols-3 xl:grid-cols-7">
        <input className={inputClass} name="search" placeholder={t.search} defaultValue={filters.search ?? ""} />
        <select className={inputClass} name="status" defaultValue={filters.status ?? ""}>
          <option value="">{t.status}: {t.all}</option>
          <option value="published">published</option>
          <option value="draft">draft</option>
          <option value="archived">archived</option>
        </select>
        <FilterSelect label={t.category} name="category" value={filters.category} options={dimensions.categories} />
        <FilterSelect label={t.application} name="application" value={filters.application} options={dimensions.applications} />
        <FilterSelect label={t.finish} name="finish" value={filters.finish} options={dimensions.finishes} />
        <FilterSelect label={t.gloss} name="gloss" value={filters.gloss} options={dimensions.glosses} />
        <button className={secondaryButtonClass}>{t.search}</button>
      </form>

      <section className="overflow-hidden rounded-lg border border-admin-line bg-white shadow-admin-soft">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-collapse text-left">
            <thead className="bg-admin-primary text-xs font-black uppercase text-white">
              <tr>
                <th className="px-4 py-3">{t.product}</th>
                <th className="px-4 py-3">{t.category}</th>
                <th className="px-4 py-3">{t.application}</th>
                <th className="px-4 py-3">{t.finish}</th>
                <th className="px-4 py-3">{t.sampleStatus}</th>
                <th className="px-4 py-3">{t.status}</th>
                <th className="px-4 py-3">{t.sort}</th>
                <th className="px-4 py-3">{t.updatedAt}</th>
                <th className="px-4 py-3">{t.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-line">
              {products.map((product) => {
                const image = [...(product.product_images ?? [])].sort((a, b) => a.slot - b.slot)[0]?.url;
                return (
                  <tr key={product.id} className="hover:bg-admin-bg">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="grid size-12 place-items-center overflow-hidden rounded-md bg-admin-bg text-xs font-black text-admin-muted">
                          {image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            "IMG"
                          )}
                        </div>
                        <div>
                          <strong className="block text-sm font-black">{product.name_en}</strong>
                          <span className="text-xs font-bold text-admin-muted">
                            {product.legacy_id} · {product.name_zh ?? "-"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-bold">{product.categories?.name_en ?? "-"}</td>
                    <td className="px-4 py-4 text-sm font-bold">{product.applications?.name_en ?? "-"}</td>
                    <td className="px-4 py-4 text-sm font-bold">{product.finishes?.name_en ?? "-"}</td>
                    <td className="px-4 py-4 text-sm font-bold">{product.sample_status ?? (product.sample_available ? t.yes : t.no)}</td>
                    <td className="px-4 py-4"><StatusBadge value={product.status} /></td>
                    <td className="px-4 py-4 text-sm font-bold">{product.sort}</td>
                    <td className="px-4 py-4 text-sm font-bold text-admin-muted">{formatDate(product.updated_at)}</td>
                    <td className="px-4 py-4">
                      <Link href={`/${locale}/products/${product.id}`} className="text-sm font-black text-admin-primary hover:underline">
                        {t.edit}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!products.length ? <p className="p-8 text-center text-sm font-bold text-admin-muted">{t.empty}</p> : null}
      </section>
    </>
  );
}

function FilterSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string | undefined;
  options: Array<{ id: string; name_en: string; name_zh: string | null }>;
}) {
  return (
    <select className={inputClass} name={name} defaultValue={value ?? ""}>
      <option value="">
        {label}: All
      </option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name_en} / {option.name_zh ?? "-"}
        </option>
      ))}
    </select>
  );
}
