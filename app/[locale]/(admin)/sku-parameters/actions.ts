"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { numberOrNull, textOrNull } from "@/lib/format";
import { normalizeLocale, oppositeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

function parseJson(value: FormDataEntryValue | null, fallback: unknown) {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function path(locale: string, id?: string | null, query?: string) {
  return `/${locale}/sku-parameters${id ? `/${id}` : ""}${query ? `?${query}` : ""}`;
}

export async function saveProductSkuAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const id = textOrNull(formData.get("id"));
  const skuCode = String(formData.get("sku_code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const baseInfo = parseJson(formData.get("base_info"), {});
  const parameterOverrides = parseJson(formData.get("parameter_overrides"), []);
  const customLabels = parseJson(formData.get("custom_labels"), []);
  const images = parseJson(formData.get("images"), []);
  const certifications = parseJson(formData.get("certifications"), []);

  if (!skuCode || !name) redirect(path(locale, id, "error=required"));
  if (
    !baseInfo ||
    !Array.isArray(parameterOverrides) ||
    !Array.isArray(customLabels) ||
    !Array.isArray(images) ||
    !Array.isArray(certifications)
  ) {
    redirect(path(locale, id, "error=json"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    sku_code: skuCode,
    slug: textOrNull(formData.get("slug")),
    system_id: textOrNull(formData.get("system_id")),
    status: String(formData.get("status") ?? "draft"),
    sort: Number(formData.get("sort") ?? 0),
    price: numberOrNull(formData.get("price")),
    sample_fee: numberOrNull(formData.get("sample_fee")),
    images,
    certifications,
    updated_by: user?.id ?? null,
  };

  const result = id
    ? await supabase.from("product_skus").update(payload).eq("id", id).select("id").single()
    : await supabase
        .from("product_skus")
        .insert({ ...payload, created_by: user?.id ?? null })
        .select("id")
        .single();

  if (result.error || !result.data) redirect(path(locale, id, "error=save"));
  const skuId = result.data.id as string;

  const { error } = await supabase.from("product_sku_translations").upsert({
    sku_id: skuId,
    locale,
    name,
    intro: textOrNull(formData.get("intro")),
    description: textOrNull(formData.get("description")),
    base_info: baseInfo as Record<string, unknown>,
    parameter_overrides: parameterOverrides,
    custom_labels: customLabels,
  });
  if (error) redirect(path(locale, skuId, "error=save"));

  revalidatePath(`/${locale}/sku-parameters`);
  redirect(path(locale, skuId, "saved=1"));
}

export async function archiveProductSkuAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("action_status") ?? "archived");
  const supabase = await createClient();
  await supabase.from("product_skus").update({ status }).eq("id", id);
  revalidatePath(`/${locale}/sku-parameters`);
  redirect(`/${locale}/sku-parameters`);
}

export async function copyProductSkuTranslationAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const fromLocale = normalizeLocale(String(formData.get("from_locale") ?? oppositeLocale(locale)));
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_sku_translations")
    .select("name,intro,description,base_info,parameter_overrides,custom_labels")
    .eq("sku_id", id)
    .eq("locale", fromLocale)
    .maybeSingle();

  if (error || !data) redirect(path(locale, id, "error=copy"));

  const { error: upsertError } = await supabase.from("product_sku_translations").upsert({
    sku_id: id,
    locale,
    name: data.name,
    intro: data.intro,
    description: data.description,
    base_info: data.base_info ?? {},
    parameter_overrides: data.parameter_overrides ?? [],
    custom_labels: data.custom_labels ?? [],
  });
  if (upsertError) redirect(path(locale, id, "error=copy"));

  revalidatePath(`/${locale}/sku-parameters`);
  redirect(path(locale, id, "saved=1"));
}
