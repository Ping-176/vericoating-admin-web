"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizeLocale } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function loginAction(formData: FormData) {
  const locale = normalizeLocale(String(formData.get("locale") ?? "zh"));
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/login?env=1`);
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/${locale}/login?error=1`);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  if (profile?.role !== "admin") {
    await supabase.auth.signOut();
    redirect(`/${locale}/no-access`);
  }

  redirect(`/${locale}/dashboard`);
}
