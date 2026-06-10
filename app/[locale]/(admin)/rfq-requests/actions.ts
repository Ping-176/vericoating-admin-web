"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { textOrNull } from "@/lib/format";
import { normalizeLocale } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export async function updateRfqRequestAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const payload = {
    status: String(formData.get("status") ?? "new"),
    admin_note: textOrNull(formData.get("admin_note")),
  };

  const { error } = await supabase.from("rfq_requests").update(payload).eq("id", id);
  if (error) redirect(`/${locale}/rfq-requests/${id}?error=save`);

  revalidatePath(`/${locale}/rfq-requests`);
  revalidatePath(`/${locale}/rfq-requests/${id}`);
  redirect(`/${locale}/rfq-requests/${id}?saved=1`);
}
