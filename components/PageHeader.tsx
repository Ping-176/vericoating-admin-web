export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-3xl font-black tracking-normal text-admin-graphite">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-admin-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
