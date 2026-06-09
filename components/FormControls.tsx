import type { ReactNode } from "react";

export function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid gap-2 text-sm font-black text-admin-graphite ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 w-full rounded-md border border-admin-line bg-white px-3 text-sm font-bold text-admin-graphite outline-none transition focus:border-admin-accent-deep focus:ring-2 focus:ring-admin-accent/40";

export const textareaClass =
  "min-h-28 w-full rounded-md border border-admin-line bg-white px-3 py-3 text-sm font-bold leading-6 text-admin-graphite outline-none transition focus:border-admin-accent-deep focus:ring-2 focus:ring-admin-accent/40";

export const buttonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-admin-primary bg-admin-primary px-4 text-sm font-black !text-white transition hover:bg-admin-accent-deep hover:!text-white disabled:!text-white";

export const secondaryButtonClass =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-admin-line bg-white px-4 text-sm font-black text-admin-primary transition hover:bg-admin-bg";
