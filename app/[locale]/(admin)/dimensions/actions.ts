"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dimensionTables, type DimensionTable } from "@/lib/admin-data";
import { normalizeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { textOrNull } from "@/lib/format";

function safeTable(value: FormDataEntryValue | null): DimensionTable {
  const table = String(value ?? "categories") as DimensionTable;
  return dimensionTables.includes(table) ? table : "categories";
}

export async function saveDimensionAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const table = safeTable(formData.get("table"));
  const id = textOrNull(formData.get("id"));
  const supabase = await createClient();
  const payload = {
    code: String(formData.get("code") ?? "").trim(),
    name_en: String(formData.get("name_en") ?? "").trim(),
    name_zh: textOrNull(formData.get("name_zh")),
    sort: Number(formData.get("sort") ?? 0),
  };

  if (!payload.code || !payload.name_en) {
    redirect(`/${locale}/dimensions?type=${table}&error=required`);
  }

  const result = id
    ? await supabase.from(table).update(payload).eq("id", id)
    : await supabase.from(table).insert(payload);

  if (result.error) redirect(`/${locale}/dimensions?type=${table}&error=save`);

  revalidatePath(`/${locale}/dimensions`);
  redirect(`/${locale}/dimensions?type=${table}&saved=1`);
}

export async function deleteDimensionAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const table = safeTable(formData.get("table"));
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  await supabase.from(table).delete().eq("id", id);
  revalidatePath(`/${locale}/dimensions`);
  redirect(`/${locale}/dimensions?type=${table}`);
}
