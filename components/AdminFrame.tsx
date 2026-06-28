"use client";

import Link from "next/link";
import { Languages, LogOut } from "lucide-react";
import { signOutAction } from "@/app/[locale]/actions";
import { AdminSidebar, navItems } from "@/components/AdminSidebar";
import { oppositeLocale, type Dictionary, type Locale } from "@/lib/i18n";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const STORAGE_KEY = "vericoating-admin-sidebar-collapsed";

export function AdminFrame({
  locale,
  t,
  email,
  children,
}: {
  locale: Locale;
  t: Dictionary;
  email: string | undefined;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const otherLocale = oppositeLocale(locale);
  const otherLocalePath = pathname.replace(`/${locale}`, `/${otherLocale}`);

  useEffect(() => {
    setCollapsed(window.localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const toggle = () => {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-admin-bg text-admin-graphite">
      <AdminSidebar locale={locale} t={t} collapsed={collapsed} onToggle={toggle} />

      <div className={`transition-[padding] duration-200 ${collapsed ? "lg:pl-16" : "lg:pl-60"}`}>
        <header className="sticky top-0 z-10 border-b border-admin-line bg-white/90 px-4 backdrop-blur lg:px-8">
          <div className="flex min-h-16 items-center justify-between gap-4">
            <Link href={`/${locale}/dashboard`} className="flex items-center gap-3 lg:hidden">
              <span className="grid size-9 place-items-center bg-admin-primary text-xs font-black text-white">
                T
              </span>
              <strong>{t.appName}</strong>
            </Link>
            <nav className="hidden items-center gap-2 md:flex lg:hidden">
              {navItems.map((item) => {
                const href = `/${locale}/${item.href}`;
                const isActive = pathname === href || pathname.startsWith(`${href}/`);
                return (
                  <Link
                    key={item.href}
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-md px-3 py-2 text-xs font-black transition ${
                      isActive ? "bg-admin-primary !text-white" : "text-admin-muted hover:bg-admin-bg hover:text-admin-primary"
                    }`}
                  >
                    {t[item.key]}
                  </Link>
                );
              })}
            </nav>
            <div className="ml-auto flex items-center gap-3">
              <Link
                href={otherLocalePath}
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-admin-line bg-white px-3 text-xs font-black text-admin-primary hover:bg-admin-bg"
              >
                <Languages size={15} />
                {otherLocale.toUpperCase()}
              </Link>
              <span className="hidden text-sm font-bold text-admin-muted sm:inline">{email}</span>
              <form action={signOutAction}>
                <input type="hidden" name="locale" value={locale} />
                <button
                  className="inline-flex size-9 items-center justify-center rounded-md border border-admin-line bg-white text-admin-primary hover:bg-admin-bg"
                  title={t.signOut}
                >
                  <LogOut size={16} />
                </button>
              </form>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
