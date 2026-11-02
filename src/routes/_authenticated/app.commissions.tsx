import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageTitle, StatCard } from "@/components/StatusBadge";
import { StatusBadge } from "@/components/StatusBadge";
import { ordersQuery } from "@/lib/queries";
import { dh, summarizeCommissions } from "@/lib/commission";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/app/commissions")({ head: () => pageHead("عمولاتي", "تتبع العمولات المنتظرة والمؤكدة والمكتسبة."), component: Commissions });

function Commissions() {
  const { data = [] } = useQuery(ordersQuery());
  const c = summarizeCommissions(data);
  return (
    <>
      <PageTitle title="العمولات" sub="العمولة كتحسب مكتسبة غير ملي كيتوصل الطلب. الطلبات الملغية ما كتحسبش." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="في الانتظار" value={dh(c.pending)} />
        <StatCard label="مؤكدة / مشحونة" value={dh(c.confirmed)} />
        <StatCard label="مكتسبة (تم التوصيل)" value={dh(c.delivered)} />
        <StatCard label="المجموع" value={dh(c.total)} accent />
      </div>
      <div className="mt-6 divide-y rounded-xl border bg-card shadow-soft">
        {data.map((o) => (
          <div key={o.id} className="flex items-center justify-between gap-2 p-3 text-sm">
            <div>
              <p className="font-bold" dir="ltr">{o.order_number}</p>
              <p className="text-muted-foreground">{o.products?.name}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={o.status === "cancelled" ? "text-muted-foreground line-through" : "font-bold text-success"}>{dh(o.commission)}</span>
              <StatusBadge status={o.status} />
            </div>
          </div>
        ))}
        {!data.length && <p className="p-6 text-center text-muted-foreground">ما كاين حتى عمولة دابا.</p>}
      </div>
    </>
  );
}
