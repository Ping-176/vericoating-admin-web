"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { textOrNull } from "@/lib/format";
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
  return `/${locale}/system-parameters${id ? `/${id}` : ""}${query ? `?${query}` : ""}`;
}

export async function saveProductSystemAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const id = textOrNull(formData.get("id"));
  const systemCode = String(formData.get("system_code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const baseCommon = parseJson(formData.get("base_common"), {});
  const baseInfo = parseJson(formData.get("base_info"), {});
  const parameterGroups = parseJson(formData.get("parameter_groups"), []);
  const certifications = parseJson(formData.get("certifications"), []);

  if (!systemCode || !name) redirect(path(locale, id, "error=required"));
  if (!baseCommon || !baseInfo || !Array.isArray(parameterGroups) || !Array.isArray(certifications)) {
    redirect(path(locale, id, "error=json"));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    system_code: systemCode,
    status: String(formData.get("status") ?? "draft"),
    sort: Number(formData.get("sort") ?? 0),
    base_common: baseCommon as Record<string, unknown>,
    certifications,
    updated_by: user?.id ?? null,
  };

  const result = id
    ? await supabase.from("product_systems").update(payload).eq("id", id).select("id").single()
    : await supabase
        .from("product_systems")
        .insert({ ...payload, created_by: user?.id ?? null })
        .select("id")
        .single();

  if (result.error || !result.data) redirect(path(locale, id, "error=save"));
  const systemId = result.data.id as string;

  const { error } = await supabase.from("product_system_translations").upsert({
    system_id: systemId,
    locale,
    name,
    intro: textOrNull(formData.get("intro")),
    description: textOrNull(formData.get("description")),
    base_info: baseInfo as Record<string, unknown>,
    parameter_groups: parameterGroups,
  });
  if (error) redirect(path(locale, systemId, "error=save"));

  revalidatePath(`/${locale}/system-parameters`);
  redirect(path(locale, systemId, "saved=1"));
}

export async function archiveProductSystemAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("action_status") ?? "archived");
  const supabase = await createClient();
  await supabase.from("product_systems").update({ status }).eq("id", id);
  revalidatePath(`/${locale}/system-parameters`);
  redirect(`/${locale}/system-parameters`);
}

export async function copyProductSystemTranslationAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const fromLocale = normalizeLocale(String(formData.get("from_locale") ?? oppositeLocale(locale)));
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("product_system_translations")
    .select("name,intro,description,base_info,parameter_groups")
    .eq("system_id", id)
    .eq("locale", fromLocale)
    .maybeSingle();

  if (error || !data) redirect(path(locale, id, "error=copy"));

  const { error: upsertError } = await supabase.from("product_system_translations").upsert({
    system_id: id,
    locale,
    name: data.name,
    intro: data.intro,
    description: data.description,
    base_info: data.base_info ?? {},
    parameter_groups: data.parameter_groups ?? [],
  });
  if (upsertError) redirect(path(locale, id, "error=copy"));

  revalidatePath(`/${locale}/system-parameters`);
  redirect(path(locale, id, "saved=1"));
}
