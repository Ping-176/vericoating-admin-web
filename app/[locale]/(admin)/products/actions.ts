"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { checkboxValue, numberOrNull, textOrNull } from "@/lib/format";
import { normalizeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

function parseLines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseJson(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function replaceChildren(productId: string, formData: FormData) {
  const supabase = await createClient();

  await Promise.all([
    supabase.from("product_images").delete().eq("product_id", productId),
    supabase.from("product_performance").delete().eq("product_id", productId),
    supabase.from("product_documents").delete().eq("product_id", productId),
    supabase.from("product_sample_specs").delete().eq("product_id", productId),
  ]);

  const imageRows = parseLines(formData.get("images")).map((url, index) => ({
    product_id: productId,
    url,
    slot: index + 1,
    sort: index,
  }));
  if (imageRows.length) await supabase.from("product_images").insert(imageRows);

  const performanceRows = parseLines(formData.get("performance")).map((line, index) => {
    const [test_item, standard_method, test_index] = line.split("|").map((part) => part.trim());
    return {
      product_id: productId,
      test_item,
      standard_method: standard_method || null,
      test_index: test_index || null,
      sort: index,
    };
  });
  if (performanceRows.length) await supabase.from("product_performance").insert(performanceRows);

  const documentRows = parseLines(formData.get("documents")).map((line, index) => {
    const [doc_type, label, file_url] = line.split("|").map((part) => part.trim());
    return {
      product_id: productId,
      doc_type,
      label: label || doc_type,
      file_url: file_url || null,
      sort: index,
    };
  });
  if (documentRows.length) await supabase.from("product_documents").insert(documentRows);

  const specRows = parseLines(formData.get("sample_specs")).map((spec, index) => ({
    product_id: productId,
    spec,
    sort: index,
  }));
  if (specRows.length) await supabase.from("product_sample_specs").insert(specRows);
}

function productPayload(formData: FormData) {
  return {
    legacy_id: String(formData.get("legacy_id") ?? "").trim(),
    slug: String(formData.get("slug") ?? "").trim(),
    name_en: String(formData.get("name_en") ?? "").trim(),
    name_zh: textOrNull(formData.get("name_zh")),
    intro_en: textOrNull(formData.get("intro_en")),
    intro_zh: textOrNull(formData.get("intro_zh")),
    description_en: textOrNull(formData.get("description_en")),
    description_zh: textOrNull(formData.get("description_zh")),
    price_usd: numberOrNull(formData.get("price_usd")),
    model: textOrNull(formData.get("model")),
    moq: textOrNull(formData.get("moq")),
    curing_schedule: textOrNull(formData.get("curing_schedule")),
    category_id: textOrNull(formData.get("category_id")),
    application_id: textOrNull(formData.get("application_id")),
    finish_id: textOrNull(formData.get("finish_id")),
    gloss_id: textOrNull(formData.get("gloss_id")),
    sample_available: checkboxValue(formData.get("sample_available")),
    sample_fee_usd: numberOrNull(formData.get("sample_fee_usd")) ?? 0,
    sample_fee_deductible: checkboxValue(formData.get("sample_fee_deductible")),
    sample_lead_time: textOrNull(formData.get("sample_lead_time")),
    sample_status: textOrNull(formData.get("sample_status")),
    unavailable_reason: textOrNull(formData.get("unavailable_reason")),
    tds_available: checkboxValue(formData.get("tds_available")),
    msds_available: checkboxValue(formData.get("msds_available")),
    basic_info: parseJson(formData.get("basic_info")),
    packaging_delivery: parseJson(formData.get("packaging_delivery")),
    status: String(formData.get("status") ?? "draft"),
    sort: Number(formData.get("sort") ?? 0),
  };
}

export async function saveProductAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const id = textOrNull(formData.get("id"));
  const supabase = await createClient();
  const payload = productPayload(formData);

  if (!payload.legacy_id || !payload.slug || !payload.name_en) {
    redirect(`/${locale}/products${id ? `/${id}` : "/new"}?error=required`);
  }

  if (id) {
    const { error } = await supabase.from("products").update(payload).eq("id", id);
    if (error) redirect(`/${locale}/products/${id}?error=save`);
    await replaceChildren(id, formData);
    revalidatePath(`/${locale}/products/${id}`);
    revalidatePath(`/${locale}/products`);
    redirect(`/${locale}/products/${id}?saved=1`);
  }

  const { data, error } = await supabase.from("products").insert(payload).select("id").single();
  if (error || !data) redirect(`/${locale}/products/new?error=save`);

  await replaceChildren(data.id, formData);
  revalidatePath(`/${locale}/products`);
  redirect(`/${locale}/products/${data.id}?saved=1`);
}

export async function archiveProductAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "archived");
  const supabase = await createClient();
  await supabase.from("products").update({ status }).eq("id", id);
  revalidatePath(`/${locale}/products`);
  redirect(`/${locale}/products`);
}
