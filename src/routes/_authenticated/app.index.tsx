import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageTitle, StatCard } from "@/components/StatusBadge";
import { OrderList } from "@/components/OrderList";
import { ordersQuery } from "@/lib/queries";
import { useMe } from "@/lib/session";
import { dh, summarizeCommissions } from "@/lib/commission";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/app/")({ head: () => pageHead("لوحة الأفلييت", "ملخص نشاط الأفلييت وآخر الطلبات والعمولات."), component: Dashboard });

function Dashboard() {
  const me = useMe();
  const { data: orders = [] } = useQuery(ordersQuery());
  const c = summarizeCommissions(orders);
  return (
    <>
      <PageTitle title={`مرحبا ${me.data?.profile?.full_name ?? ""} 👋`} sub="هادي نظرة سريعة على النشاط ديالك" />
      {me.data?.profile && !me.data.profile.active && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">الحساب ديالك موقوف حاليا، ما تقدرش تزيد طلبات جديدة.</p>
      )}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="مجموع الطلبات" value={orders.length} />
        <StatCard label="في الانتظار" value={orders.filter((o) => o.status === "pending").length} />
        <StatCard label="تم التوصيل" value={orders.filter((o) => o.status === "delivered").length} />
        <StatCard label="مجموع العمولة" value={dh(c.total)} accent />
      </div>
      <Button asChild variant="gold" size="lg" className="mt-5 w-full md:w-auto">
        <Link to="/app/new-order"><PlusCircle /> إضافة طلب جديد</Link>
      </Button>
      <h2 className="mb-3 mt-8 text-lg font-bold">آخر الطلبات</h2>
      <OrderList orders={orders.slice(0, 5)} />
    </>
  );
}
