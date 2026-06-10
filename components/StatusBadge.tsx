const statusStyles: Record<string, string> = {
  published: "bg-admin-accent text-admin-primary",
  draft: "bg-slate-100 text-slate-700",
  archived: "bg-stone-200 text-stone-700",
  new: "bg-admin-accent text-admin-primary",
  technical_review: "bg-amber-100 text-amber-800",
  preparing_sample: "bg-blue-100 text-blue-800",
  dispatched: "bg-indigo-100 text-indigo-800",
  quoted: "bg-cyan-100 text-cyan-800",
  sample_recommended: "bg-violet-100 text-violet-800",
  closed: "bg-emerald-100 text-emerald-800",
  completed: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const status = value || "-";
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full px-3 text-xs font-black ${
        statusStyles[status] ?? "bg-admin-bg text-admin-muted"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
