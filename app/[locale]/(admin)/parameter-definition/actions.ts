"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { textOrNull } from "@/lib/format";
import { normalizeLocale, oppositeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

type OptionInput = {
  code: string;
  label: string;
  description?: string | null;
  canonical_value?: string | null;
  is_active?: boolean;
  sort?: number;
};

function parseOptions(value: FormDataEntryValue | null): OptionInput[] | null {
  const text = String(value ?? "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed
      .map((item) => {
        const row = item as Record<string, unknown>;
        return {
          code: String(row.code ?? "").trim(),
          label: String(row.label ?? "").trim(),
          description: typeof row.description === "string" && row.description.trim() ? row.description.trim() : null,
          canonical_value: typeof row.canonical_value === "string" && row.canonical_value.trim() ? row.canonical_value.trim() : null,
          is_active: row.is_active !== false,
          sort: Number.isFinite(Number(row.sort)) ? Number(row.sort) : 0,
        };
      })
      .filter((option) => option.code && option.label);
  } catch {
    return null;
  }
}

function path(locale: string, id?: string | null, query?: string) {
  return `/${locale}/parameter-definition${id ? `/${id}` : ""}${query ? `?${query}` : ""}`;
}

export async function saveParameterDefinitionAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const id = textOrNull(formData.get("id"));
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const options = parseOptions(formData.get("options_json"));

  if (!code || !name) redirect(path(locale, id, "error=required"));
  if (options === null) redirect(path(locale, id, "error=json"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const payload = {
    code,
    select_type: String(formData.get("select_type") ?? "single") === "multiple" ? "multiple" : "single",
    value_type: String(formData.get("value_type") ?? "option"),
    is_active: formData.get("is_active") === "on",
    sort: Number(formData.get("sort") ?? 0),
    updated_by: user?.id ?? null,
  };

  const result = id
    ? await supabase.from("parameter_definitions").update(payload).eq("id", id).select("id").single()
    : await supabase
        .from("parameter_definitions")
        .insert({ ...payload, created_by: user?.id ?? null })
        .select("id")
        .single();

  if (result.error || !result.data) redirect(path(locale, id, "error=save"));
  const parameterId = result.data.id as string;

  const { error: translationError } = await supabase.from("parameter_definition_translations").upsert({
    parameter_id: parameterId,
    locale,
    name,
    description: textOrNull(formData.get("description")),
  });
  if (translationError) redirect(path(locale, parameterId, "error=save"));

  const { data: existingOptions, error: existingError } = await supabase
    .from("parameter_definition_options")
    .select("id,code")
    .eq("parameter_id", parameterId);
  if (existingError) redirect(path(locale, parameterId, "error=save"));

  const submittedCodes = new Set(options.map((option) => option.code));
  for (const option of options) {
    const { data: optionRow, error: optionError } = await supabase
      .from("parameter_definition_options")
      .upsert(
        {
          parameter_id: parameterId,
          code: option.code,
          canonical_value: option.canonical_value,
          is_active: option.is_active,
          sort: option.sort,
        },
        { onConflict: "parameter_id,code" },
      )
      .select("id")
      .single();
    if (optionError || !optionRow) redirect(path(locale, parameterId, "error=save"));

    const { error } = await supabase.from("parameter_definition_option_translations").upsert({
      option_id: optionRow.id,
      locale,
      label: option.label,
      description: option.description,
    });
    if (error) redirect(path(locale, parameterId, "error=save"));
  }

  const removedCodes =
    locale === "zh"
      ? ((existingOptions ?? []) as Array<{ code: string }>)
          .map((option) => option.code)
          .filter((code) => !submittedCodes.has(code))
      : [];
  if (removedCodes.length) {
    const { error: deleteError } = await supabase
      .from("parameter_definition_options")
      .delete()
      .eq("parameter_id", parameterId)
      .in("code", removedCodes);
    if (deleteError) redirect(path(locale, parameterId, "error=save"));
  }

  revalidatePath(`/${locale}/parameter-definition`);
  redirect(path(locale, parameterId, "saved=1"));
}

export async function copyParameterDefinitionTranslationAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const fromLocale = normalizeLocale(String(formData.get("from_locale") ?? oppositeLocale(locale)));
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();

  const { data: sourceTranslation, error: translationError } = await supabase
    .from("parameter_definition_translations")
    .select("name,description")
    .eq("parameter_id", id)
    .eq("locale", fromLocale)
    .maybeSingle();
  if (translationError) redirect(path(locale, id, "error=copy"));

  const { data: targetTranslation, error: targetTranslationError } = await supabase
    .from("parameter_definition_translations")
    .select("parameter_id")
    .eq("parameter_id", id)
    .eq("locale", locale)
    .maybeSingle();
  if (targetTranslationError) redirect(path(locale, id, "error=copy"));

  if (!targetTranslation && !sourceTranslation) redirect(path(locale, id, "error=copy"));

  if (!targetTranslation && sourceTranslation) {
    const { error: upsertTranslationError } = await supabase.from("parameter_definition_translations").upsert({
      parameter_id: id,
      locale,
      name: sourceTranslation.name,
      description: sourceTranslation.description,
    });
    if (upsertTranslationError) redirect(path(locale, id, "error=copy"));
  }

  const { data: sourceOptions, error: optionsError } = await supabase
    .from("parameter_definition_options")
    .select("id,parameter_definition_option_translations(label,description,locale)")
    .eq("parameter_id", id);
  if (optionsError) redirect(path(locale, id, "error=copy"));

  for (const option of (sourceOptions ?? []) as Array<{
    id: string;
    parameter_definition_option_translations?: Array<{ locale: string; label: string | null; description: string | null }> | null;
  }>) {
    const source = option.parameter_definition_option_translations?.find((row) => row.locale === fromLocale);
    const target = option.parameter_definition_option_translations?.find((row) => row.locale === locale);
    if (!source || target) continue;
    const { error } = await supabase.from("parameter_definition_option_translations").upsert({
      option_id: option.id,
      locale,
      label: source.label,
      description: source.description,
    });
    if (error) redirect(path(locale, id, "error=copy"));
  }

  revalidatePath(`/${locale}/parameter-definition`);
  redirect(path(locale, null, "saved=1"));
}

export async function deleteParameterDefinitionAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const id = String(formData.get("id") ?? "");
  const code = String(formData.get("code") ?? "");
  const supabase = await createClient();

  const [systems, skus] = await Promise.all([
    supabase.from("product_system_translations").select("parameter_groups"),
    supabase.from("product_sku_translations").select("parameter_overrides"),
  ]);

  const referenced =
    JSON.stringify(systems.data ?? []).includes(`"parameterCode":"${code}"`) ||
    JSON.stringify(skus.data ?? []).includes(`"parameterCode":"${code}"`);

  if (referenced) redirect(path(locale, id, "error=referenced"));

  await supabase.from("parameter_definitions").delete().eq("id", id);
  revalidatePath(`/${locale}/parameter-definition`);
  redirect(`/${locale}/parameter-definition`);
}
