export function PageHeader({
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  if (!action) return null;

  return <div className="mb-5 flex justify-end">{action}</div>;
}
