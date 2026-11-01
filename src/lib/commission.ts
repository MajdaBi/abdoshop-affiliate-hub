export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

export const STATUSES: OrderStatus[] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending · في الانتظار",
  confirmed: "Confirmed · مؤكد",
  shipped: "Shipped · تم الشحن",
  delivered: "Delivered · تم التوصيل",
  cancelled: "Cancelled · ملغى",
};

export interface CommissionSummary {
  pending: number; // orders still pending
  confirmed: number; // confirmed or shipped
  delivered: number; // earned
  total: number; // everything except cancelled
}

/** Cancelled orders never count; only delivered orders are earned. */
export function summarizeCommissions(
  orders: { status: OrderStatus; commission: number | string }[],
): CommissionSummary {
  const s: CommissionSummary = { pending: 0, confirmed: 0, delivered: 0, total: 0 };
  for (const o of orders) {
    const c = Number(o.commission) || 0;
    if (o.status === "cancelled") continue;
    s.total += c;
    if (o.status === "pending") s.pending += c;
    else if (o.status === "delivered") s.delivered += c;
    else s.confirmed += c;
  }
  return s;
}

export const dh = (n: number | string) => `${Number(n).toLocaleString("fr-MA")} DH`;
export const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-MA");
