import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { affiliatesQuery } from "@/lib/admin-queries";
import { ordersQuery } from "@/lib/queries";
import { affiliateSummary, adminSummary } from "@/lib/admin-summary";
import { dh } from "@/lib/commission";
import { pageHead } from "@/lib/page-head";
import { PageTitle, StatCard } from "@/components/StatusBadge";
import { AdminError, AdminNotFound } from "@/components/AdminStates";

export const Route = createFileRoute("/_authenticated/admin/commissions")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(ordersQuery(true)), context.queryClient.ensureQueryData(affiliatesQuery)]),
  head: () => pageHead("إدارة العمولات", "العمولات المنتظرة والمؤكدة والمستحقة لكل أفلييت."),
  errorComponent: AdminError, notFoundComponent: AdminNotFound, component: Commissions,
});
function Commissions() {
  const { data: orders } = useSuspenseQuery(ordersQuery(true));
  const { data: affiliates } = useSuspenseQuery(affiliatesQuery);
  const summary = adminSummary(orders).commissions;
  return <><PageTitle title="إدارة العمولات" /><div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"><StatCard label="في الانتظار" value={dh(summary.pending)} /><StatCard label="مؤكدة / مشحونة" value={dh(summary.confirmed)} /><StatCard label="مستحقة · تم التوصيل" value={dh(summary.delivered)} accent /><StatCard label="المجموع بدون الملغاة" value={dh(summary.total)} /></div>
    <div className="overflow-x-auto border-y"><table className="w-full text-start text-sm"><thead className="bg-muted"><tr>{["الأفلييت", "الطلبات", "في الانتظار", "مؤكدة / مشحونة", "مستحقة", "المجموع"].map((h) => <th key={h} className="whitespace-nowrap p-3 text-start">{h}</th>)}</tr></thead><tbody>{affiliates.map((a) => { const s = affiliateSummary(orders, a.id); return <tr key={a.id} className="border-t"><td className="p-3"><p className="font-bold">{a.full_name || "—"}</p><p dir="ltr" className="text-xs text-muted-foreground">{a.email}</p></td><td className="p-3">{s.count}</td>{[s.commissions.pending, s.commissions.confirmed, s.commissions.delivered, s.commissions.total].map((v, i) => <td key={i} className="whitespace-nowrap p-3">{dh(v)}</td>)}</tr>; })}</tbody></table></div>{!affiliates.length && <p className="py-12 text-center text-muted-foreground">ما كاين حتى أفلييت.</p>}
  </>;
}