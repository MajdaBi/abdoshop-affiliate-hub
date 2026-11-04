import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { dh, fmtDate } from "@/lib/commission";
import type { OrderRow } from "@/lib/queries";

export function OrderList({ orders, admin, renderActions, renderListActions }: { orders: OrderRow[]; admin?: boolean; renderActions?: (o: OrderRow) => ReactNode; renderListActions?: (o: OrderRow) => ReactNode }) {
  const [open, setOpen] = useState<OrderRow | null>(null);
  const current = open ? orders.find((o) => o.id === open.id) ?? null : null;
  if (!orders.length) return <p className="rounded-xl border bg-card p-8 text-center text-muted-foreground">ما كاين حتى طلب.</p>;
  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {orders.map((o) => (
          <div key={o.id} className="rounded-xl border bg-card shadow-soft"><button onClick={() => setOpen(o)} className="w-full p-4 text-start">
            <div className="flex items-center justify-between">
              <span className="font-bold" dir="ltr">{o.order_number}</span>
              <StatusBadge status={o.status} />
            </div>
            <p className="mt-2 text-sm">{o.customer_name} · {o.city}</p>
            <p className="text-sm text-muted-foreground">{o.products?.name}{admin && o.profiles ? ` · ${o.profiles.full_name}` : ""}</p>
            <div className="mt-2 flex justify-between text-sm">
              <span>{dh(o.selling_price)}</span>
              <span className="text-success">عمولة: {dh(o.commission)}</span>
            </div>
          </button>{admin && renderListActions && <div className="px-4 pb-4">{renderListActions(o)}</div>}</div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border bg-card shadow-soft md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr className="text-start">
              {["رقم الطلب", "الزبون", ...(admin ? ["الهاتف"] : []), "المنتج", "المدينة", ...(admin ? ["الأفلييت"] : []), "الثمن", "العمولة", "التاريخ", "الحالة"].map((h) => (
                <th key={h} className="px-3 py-3 text-start font-medium">{h}</th>
              ))}
              {admin && renderListActions && <th className="px-3 py-3 text-start font-medium">الإجراءات</th>}
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} onClick={() => setOpen(o)} className="cursor-pointer border-t hover:bg-muted/50">
                <td className="px-3 py-3 font-bold" dir="ltr">{o.order_number}</td>
                <td className="px-3 py-3">{o.customer_name}</td>
                {admin && <td className="px-3 py-3" dir="ltr">{o.customer_phone}</td>}
                <td className="px-3 py-3">{o.products?.name}{(o.color || o.size) && <span className="text-muted-foreground"> · {[o.color, o.size].filter(Boolean).join(" / ")}</span>}</td>
                <td className="px-3 py-3">{o.city}</td>
                {admin && <td className="px-3 py-3">{o.profiles?.full_name}</td>}
                <td className="px-3 py-3">{dh(o.selling_price)}</td>
                <td className="px-3 py-3 text-success">{dh(o.commission)}</td>
                <td className="px-3 py-3">{fmtDate(o.created_at)}</td>
                <td className="px-3 py-3"><StatusBadge status={o.status} /></td>
                {admin && renderListActions && <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>{renderListActions(o)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={!!current} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto">
          {current && (
            <>
              <DialogHeader><DialogTitle dir="ltr" className="text-start">{current.order_number}</DialogTitle></DialogHeader>
              <div className="space-y-2 text-sm">
                <StatusBadge status={current.status} />
                <Row k="الزبون" v={current.customer_name} />
                <Row k="الهاتف" v={current.customer_phone} />
                <Row k="المدينة" v={current.city} />
                <Row k="العنوان" v={current.address} />
                <Row k="المنتج" v={current.products?.name ?? ""} />
                <Row k="اللون" v={current.color || "—"} />
                <Row k="المقاس" v={current.size || "—"} />
                <Row k="الكمية" v={String(current.quantity)} />
                <Row k="ثمن البيع" v={dh(current.selling_price)} />
                <Row k="العمولة" v={dh(current.commission)} />
                {admin && current.profiles && <Row k="الأفلييت" v={`${current.profiles.full_name} (${current.profiles.email})`} />}
                <Row k="التاريخ" v={fmtDate(current.created_at)} />
              </div>
              {renderActions?.(current)}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4 border-b py-1.5 last:border-0">
      <span className="text-muted-foreground">{k}</span>
      <span className="text-end font-medium">{v}</span>
    </div>
  );
}
