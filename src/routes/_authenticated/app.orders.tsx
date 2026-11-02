import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PageTitle } from "@/components/StatusBadge";
import { OrderList } from "@/components/OrderList";
import { ordersQuery } from "@/lib/queries";
import { STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/commission";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/app/orders")({ head: () => pageHead("طلباتي", "طلبات زبنائك وحالات التأكيد والشحن والتوصيل."), component: MyOrders });

function MyOrders() {
  const { data = [] } = useQuery(ordersQuery());
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const list = filter === "all" ? data : data.filter((o) => o.status === filter);
  return (
    <>
      <PageTitle title="طلباتي" sub="ضغط على أي طلب باش تشوف التفاصيل" />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>الكل ({data.length})</Button>
        {STATUSES.map((s) => (
          <Button key={s} size="sm" variant={filter === s ? "default" : "outline"} onClick={() => setFilter(s)}>{STATUS_LABEL[s].split(" · ")[1]}</Button>
        ))}
      </div>
      <OrderList orders={list} />
    </>
  );
}
