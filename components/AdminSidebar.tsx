"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight, Factory, FileQuestion, FlaskConical, Gauge, PackageSearch, SlidersHorizontal } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";

const navItems = [
  { key: "dashboard", href: "dashboard", icon: Gauge },
  { key: "parameterDefinition", href: "parameter-definition", icon: SlidersHorizontal },
  { key: "systemParameters", href: "system-parameters", icon: Factory },
  { key: "skuParameters", href: "sku-parameters", icon: PackageSearch },
  { key: "sampleRequests", href: "sample-requests", icon: FlaskConical },
  { key: "rfqRequests", href: "rfq-requests", icon: FileQuestion },
] as const;

export function AdminSidebar({
  locale,
  t,
  collapsed,
  onToggle,
}: {
  locale: Locale;
  t: Dictionary;
  collapsed: boolean;
  onToggle: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-20 hidden border-r border-admin-line bg-admin-primary text-white transition-[width] duration-200 lg:flex lg:flex-col ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      <div className={`border-b border-white/10 py-5 ${collapsed ? "px-2" : "px-4"}`}>
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/${locale}/dashboard`}
            className={`flex min-w-0 items-center ${collapsed ? "sr-only" : ""}`}
            title="Vericoating Admin"
          >
            {!collapsed ? (
              <span className="grid min-w-0 gap-1">
                <strong className="truncate text-lg leading-none">Vericoating</strong>
                <span className="text-xs font-black uppercase tracking-wide text-white/60">Admin</span>
              </span>
            ) : null}
          </Link>
          {!collapsed ? (
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-white/12 bg-white/8 !text-white hover:bg-white/14 hover:!text-white"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft size={17} />
            </button>
          ) : null}
        </div>
        {collapsed ? (
          <button
            type="button"
            onClick={onToggle}
            className="mx-auto mt-4 inline-flex size-9 items-center justify-center rounded-md border border-white/12 bg-white/8 !text-white hover:bg-white/14 hover:!text-white"
            aria-label="Expand sidebar"
          >
            <ChevronsRight size={17} />
          </button>
        ) : null}
      </div>

      <nav className={`grid gap-2 py-5 ${collapsed ? "px-2" : "px-3"}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const href = `/${locale}/${item.href}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              key={item.href}
              href={href}
              title={t[item.key]}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-12 items-center gap-3 rounded-md text-sm font-black transition ${
                collapsed ? "justify-center px-0" : "px-3"
              } ${
                isActive
                  ? "bg-admin-accent !text-admin-primary shadow-[inset_4px_0_0_rgba(255,255,255,0.72)]"
                  : "text-white/78 hover:bg-white/10 hover:!text-white"
              }`}
            >
              <Icon size={18} className="shrink-0" />
              {!collapsed ? <span className="truncate">{t[item.key]}</span> : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export { navItems };
