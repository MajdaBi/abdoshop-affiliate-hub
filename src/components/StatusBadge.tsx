import { Badge } from "@/components/ui/badge";
import { STATUS_LABEL, type OrderStatus } from "@/lib/commission";

export function StatusBadge({ status }: { status: OrderStatus }) {
  return <Badge variant={status}>{STATUS_LABEL[status]}</Badge>;
}

export function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 shadow-soft ${accent ? "bg-hero text-primary-foreground border-transparent" : "bg-card"}`}>
      <p className={`text-xs ${accent ? "text-primary-foreground/80" : "text-muted-foreground"}`}>{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
    </div>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
