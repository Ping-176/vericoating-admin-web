import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { normalizeLocale } from "@/lib/i18n";

const PUBLIC_FILE = /\.(?:svg|png|jpg|jpeg|gif|webp|ico)$/;

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/zh/dashboard";
    return NextResponse.redirect(url);
  }

  const firstSegment = pathname.split("/")[1];
  if (!firstSegment || (firstSegment !== "zh" && firstSegment !== "en")) {
    if (!pathname.startsWith("/_next") && !PUBLIC_FILE.test(pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${normalizeLocale(undefined)}${pathname}`;
      return NextResponse.redirect(url);
    }
  }

  let supabaseResponse = NextResponse.next({ request });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await supabase.auth.getUser();
  return supabaseResponse;
}
