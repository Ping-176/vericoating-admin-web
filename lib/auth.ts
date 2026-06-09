import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n";
import { hasSupabaseEnv } from "@/lib/supabase/env";

export async function getUser() {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getAdmin(locale: Locale) {
  if (!hasSupabaseEnv()) {
    redirect(`/${locale}/login?env=1`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, full_name, company")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect(`/${locale}/no-access`);
  }

  return { user, profile, supabase };
}
