import { summarizeCommissions, type OrderStatus } from "@/lib/commission";

interface SummaryOrder { affiliate_id: string; status: OrderStatus; commission: number; selling_price: number; quantity: number }
export function adminSummary(orders: SummaryOrder[]) {
  const delivered = orders.filter((o) => o.status === "delivered");
  return {
    count: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    delivered: delivered.length,
    revenue: delivered.reduce((sum, o) => sum + Number(o.selling_price) * o.quantity, 0),
    commissions: summarizeCommissions(orders),
  };
}
export function affiliateSummary(orders: SummaryOrder[], affiliateId: string) {
  return adminSummary(orders.filter((o) => o.affiliate_id === affiliateId));
}