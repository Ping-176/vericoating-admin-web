import { saveProductAction } from "@/app/[locale]/(admin)/products/actions";
import { Field, buttonClass, inputClass, secondaryButtonClass, textareaClass } from "@/components/FormControls";
import { ProductImageUploader } from "@/components/ProductImageUploader";
import type { Dimension, ProductDetail } from "@/lib/admin-data";
import type { Dictionary, Locale } from "@/lib/i18n";

function jsonText(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

export function ProductForm({
  locale,
  t,
  product,
  dimensions,
}: {
  locale: Locale;
  t: Dictionary;
  product?: ProductDetail | null;
  dimensions: Record<"categories" | "applications" | "finishes" | "glosses", Dimension[]>;
}) {
  const images = [...(product?.product_images ?? [])]
    .sort((a, b) => a.slot - b.slot || a.sort - b.sort)
    .map((image) => image.url);
  const performance = [...(product?.product_performance ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map((item) => [item.test_item, item.standard_method, item.test_index].filter(Boolean).join(" | "))
    .join("\n");
  const documents = [...(product?.product_documents ?? [])]
    .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
    .map((item) => [item.doc_type, item.label, item.file_url].filter(Boolean).join(" | "))
    .join("\n");
  const sampleSpecs = [...(product?.product_sample_specs ?? [])]
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.spec)
    .join("\n");

  return (
    <form action={saveProductAction} className="grid gap-6">
      <input type="hidden" name="locale" value={locale} />
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      <section className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
        <h2 className="mb-5 text-lg font-black">{t.basic}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field label={t.productId}>
            <input className={inputClass} name="legacy_id" defaultValue={product?.legacy_id ?? ""} required />
          </Field>
          <Field label={t.slug}>
            <input className={inputClass} name="slug" defaultValue={product?.slug ?? ""} required />
          </Field>
          <Field label={t.englishName}>
            <input className={inputClass} name="name_en" defaultValue={product?.name_en ?? ""} required />
          </Field>
          <Field label={t.chineseName}>
            <input className={inputClass} name="name_zh" defaultValue={product?.name_zh ?? ""} />
          </Field>
          <Field label={t.introEn}>
            <textarea className={textareaClass} name="intro_en" defaultValue={product?.intro_en ?? ""} />
          </Field>
          <Field label={t.introZh}>
            <textarea className={textareaClass} name="intro_zh" defaultValue={product?.intro_zh ?? ""} />
          </Field>
          <Field label={t.descriptionEn}>
            <textarea className={textareaClass} name="description_en" defaultValue={product?.description_en ?? ""} />
          </Field>
          <Field label={t.descriptionZh}>
            <textarea className={textareaClass} name="description_zh" defaultValue={product?.description_zh ?? ""} />
          </Field>
          <Field label={t.priceUsd}>
            <input className={inputClass} name="price_usd" type="number" step="0.01" defaultValue={String(product?.price_usd ?? "")} />
          </Field>
          <Field label={t.model}>
            <input className={inputClass} name="model" defaultValue={product?.model ?? ""} />
          </Field>
          <Field label={t.moq}>
            <input className={inputClass} name="moq" defaultValue={product?.moq ?? ""} />
          </Field>
          <Field label={t.curingSchedule}>
            <input className={inputClass} name="curing_schedule" defaultValue={product?.curing_schedule ?? ""} />
          </Field>
          <Field label={t.status}>
            <select className={inputClass} name="status" defaultValue={product?.status ?? "draft"}>
              <option value="draft">draft</option>
              <option value="published">published</option>
              <option value="archived">archived</option>
            </select>
          </Field>
          <Field label={t.sort}>
            <input className={inputClass} name="sort" type="number" defaultValue={product?.sort ?? 0} />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
        <h2 className="mb-5 text-lg font-black">{t.dimensions}</h2>
        <div className="grid gap-4 lg:grid-cols-4">
          <DimensionSelect label={t.category} name="category_id" value={product?.category_id} options={dimensions.categories} />
          <DimensionSelect label={t.application} name="application_id" value={product?.application_id} options={dimensions.applications} />
          <DimensionSelect label={t.finish} name="finish_id" value={product?.finish_id} options={dimensions.finishes} />
          <DimensionSelect label={t.gloss} name="gloss_id" value={product?.gloss_id} options={dimensions.glosses} />
        </div>
      </section>

      <section className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
        <h2 className="mb-5 text-lg font-black">{t.sampleSettings}</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-admin-line px-3 text-sm font-black">
            <input name="sample_available" type="checkbox" defaultChecked={product?.sample_available ?? false} />
            {t.sampleAvailable}
          </label>
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-admin-line px-3 text-sm font-black">
            <input name="sample_fee_deductible" type="checkbox" defaultChecked={product?.sample_fee_deductible ?? false} />
            {t.deductible}
          </label>
          <Field label={t.sampleFee}>
            <input className={inputClass} name="sample_fee_usd" type="number" step="0.01" defaultValue={String(product?.sample_fee_usd ?? 0)} />
          </Field>
          <Field label={t.sampleLeadTime}>
            <input className={inputClass} name="sample_lead_time" defaultValue={product?.sample_lead_time ?? ""} />
          </Field>
          <Field label={t.sampleStatus}>
            <input className={inputClass} name="sample_status" defaultValue={product?.sample_status ?? ""} />
          </Field>
          <Field label={t.unavailableReason}>
            <input className={inputClass} name="unavailable_reason" defaultValue={product?.unavailable_reason ?? ""} />
          </Field>
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-admin-line px-3 text-sm font-black">
            <input name="tds_available" type="checkbox" defaultChecked={product?.tds_available ?? false} />
            TDS
          </label>
          <label className="flex min-h-11 items-center gap-3 rounded-md border border-admin-line px-3 text-sm font-black">
            <input name="msds_available" type="checkbox" defaultChecked={product?.msds_available ?? false} />
            MSDS
          </label>
          <Field label={t.sampleSpecs} className="lg:col-span-2">
            <textarea className={textareaClass} name="sample_specs" defaultValue={sampleSpecs} placeholder={"1kg\n5kg\n10kg"} />
          </Field>
        </div>
      </section>

      <section className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
        <h2 className="mb-5 text-lg font-black">{t.images}</h2>
        <ProductImageUploader name="images" initialImages={images} locale={locale} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
          <h2 className="mb-5 text-lg font-black">{t.performance}</h2>
          <Field label="test item | standard method | test index">
            <textarea className={textareaClass} name="performance" defaultValue={performance} />
          </Field>
        </div>
        <div className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
          <h2 className="mb-5 text-lg font-black">{t.documents}</h2>
          <Field label="doc type | label | file url">
            <textarea className={textareaClass} name="documents" defaultValue={documents} />
          </Field>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
          <h2 className="mb-5 text-lg font-black">{t.advanced}</h2>
          <Field label="basic_info JSON">
            <textarea className={`${textareaClass} min-h-64 font-mono`} name="basic_info" defaultValue={jsonText(product?.basic_info)} />
          </Field>
        </div>
        <div className="rounded-lg border border-admin-line bg-white p-5 shadow-admin-soft">
          <h2 className="mb-5 text-lg font-black">Packaging</h2>
          <Field label="packaging_delivery JSON">
            <textarea className={`${textareaClass} min-h-64 font-mono`} name="packaging_delivery" defaultValue={jsonText(product?.packaging_delivery)} />
          </Field>
        </div>
      </section>

      <div className="sticky bottom-0 flex justify-end gap-3 border-t border-admin-line bg-admin-bg/92 py-4 backdrop-blur">
        <a href={`/${locale}/products`} className={secondaryButtonClass}>
          {t.back}
        </a>
        <button className={buttonClass}>{t.save}</button>
      </div>
    </form>
  );
}

function DimensionSelect({
  label,
  name,
  value,
  options,
}: {
  label: string;
  name: string;
  value: string | null | undefined;
  options: Dimension[];
}) {
  return (
    <Field label={label}>
      <select className={inputClass} name={name} defaultValue={value ?? ""}>
        <option value="">-</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name_en} / {option.name_zh ?? "-"}
          </option>
        ))}
      </select>
    </Field>
  );
}
