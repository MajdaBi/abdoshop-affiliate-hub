import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { PageTitle, StatCard, StatusBadge } from "@/components/StatusBadge";
import { OrderList } from "@/components/OrderList";
import { AdminError, AdminNotFound } from "@/components/AdminStates";
import { Button } from "@/components/ui/button";
import { affiliatesQuery } from "@/lib/admin-queries";
import { ordersQuery } from "@/lib/queries";
import { adminSummary } from "@/lib/admin-summary";
import { dh, STATUSES } from "@/lib/commission";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/admin/")({
  loader: ({ context }) => Promise.all([context.queryClient.ensureQueryData(ordersQuery(true)), context.queryClient.ensureQueryData(affiliatesQuery)]),
  head: () => pageHead("لوحة الإدارة", "إحصائيات الطلبات والمبيعات والأفلييتات والعمولات."),
  errorComponent: AdminError,
  notFoundComponent: AdminNotFound,
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: orders } = useSuspenseQuery(ordersQuery(true));
  const { data: affiliates } = useSuspenseQuery(affiliatesQuery);
  const summary = adminSummary(orders);
  return <>
    <PageTitle title="لوحة الإدارة" />
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatCard label="مجموع الطلبات" value={summary.count} />
      <StatCard label="الأفلييتات النشيطين" value={affiliates.filter((a) => a.active).length} />
      <StatCard label="مبيعات تم التوصيل" value={dh(summary.revenue)} />
      <StatCard label="العمولات المستحقة" value={dh(summary.commissions.delivered)} accent />
    </div>
    <h2 className="mb-3 mt-8 text-lg font-bold">حالات الطلبات</h2>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">{STATUSES.map((s) => <div key={s} className="rounded-lg border bg-card p-4"><StatusBadge status={s} /><p className="mt-3 text-2xl font-bold">{orders.filter((o) => o.status === s).length}</p></div>)}</div>
    <div className="mb-3 mt-8 flex items-center justify-between"><h2 className="text-lg font-bold">آخر الطلبات</h2><Button asChild variant="outline" size="sm"><Link to="/admin/orders">كل الطلبات</Link></Button></div>
    <OrderList orders={orders.slice(0, 8)} admin />
  </>;
}
