import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ordersQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/commission";
import { pageHead } from "@/lib/page-head";
import { PageTitle } from "@/components/StatusBadge";
import { OrderList } from "@/components/OrderList";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { AdminError, AdminNotFound } from "@/components/AdminStates";
import { useState } from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel } from "@/components/ui/alert-dialog";
import { deleteAdminOrder } from "@/lib/order-delete";
import { useMe } from "@/lib/session";
import type { OrderRow } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  validateSearch: (s: Record<string, unknown>): { q?: string; status?: OrderStatus | "all" } => ({ q: typeof s["q"] === "string" ? s["q"] : "", status: STATUSES.includes(s["status"] as OrderStatus) ? s["status"] as OrderStatus : "all" }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQuery(true)),
  head: () => pageHead("إدارة الطلبات", "متابعة طلبات جميع الأفلييتات وتحديث حالة التوصيل."),
  errorComponent: AdminError, notFoundComponent: AdminNotFound, component: Orders,
});

function Orders() {
  const { data } = useSuspenseQuery(ordersQuery(true));
  const { q = "", status = "all" } = Route.useSearch();
  const search = { q, status };
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const me = useMe();
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const deletion = useMutation({
    mutationFn: deleteAdminOrder,
    onSuccess: async (id) => {
      qc.setQueriesData<OrderRow[]>({ queryKey: ["orders"] }, (old) => old?.filter((order) => order.id !== id));
      setSelected(null);
      toast.success("تم حذف الطلب بنجاح");
      await qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: () => toast.error("تعذر حذف الطلب. حاول مرة أخرى."),
  });
  const deleteAction = (order: OrderRow) => <Button variant="outline" size="sm" className="gap-2 text-destructive" aria-label={`حذف الطلب ${order.order_number}`} disabled={deletion.isPending} onClick={() => setSelected(order)}><Trash2 className="size-4" />حذف</Button>;
  const mutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => { const { error } = await supabase.from("orders").update({ status }).eq("id", id).select("id").single(); if (error) throw error; },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["orders"] }); toast.success("تم تحديث حالة الطلب"); },
    onError: () => toast.error("تعذر تحديث حالة الطلب"),
  });
  const list = data.filter((o) => (search.status === "all" || o.status === search.status) && `${o.order_number} ${o.customer_name} ${o.customer_phone} ${o.city} ${o.profiles?.full_name ?? ""}`.toLowerCase().includes(search.q.toLowerCase()));
  return <><PageTitle title="إدارة الطلبات" /><div className="mb-5 flex flex-col gap-3 md:flex-row">
    <Input aria-label="البحث عن طلب" placeholder="رقم الطلب، الزبون أو الأفلييت" value={search.q} onChange={(e) => navigate({ search: { ...search, q: e.target.value }, replace: true })} />
    <Select value={search.status} onValueChange={(status) => navigate({ search: { ...search, status: status as OrderStatus | "all" } })}><SelectTrigger aria-label="تصفية الحالة" className="md:w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select>
  </div><OrderList orders={list} admin renderListActions={me.data?.isAdmin ? deleteAction : undefined} renderActions={(o) => <div className="mt-3 border-t pt-4"><p className="mb-2 text-sm font-bold">تحديث الحالة</p><Select value={o.status} disabled={mutation.isPending} onValueChange={(status) => mutation.mutate({ id: o.id, status: status as OrderStatus })}><SelectTrigger aria-label="تحديث حالة الطلب"><SelectValue /></SelectTrigger><SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent></Select></div>} />
  <AlertDialog open={selected !== null} onOpenChange={(open) => { if (!open && !deletion.isPending) setSelected(null); }}>
    <AlertDialogContent dir="rtl" className="max-w-[calc(100%-2rem)] sm:max-w-lg">
      <AlertDialogHeader><AlertDialogTitle className="text-start">حذف الطلب <span dir="ltr">{selected?.order_number}</span></AlertDialogTitle><AlertDialogDescription dir="ltr" className="text-start">Are you sure you want to delete this order? This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
      <AlertDialogFooter className="gap-2"><AlertDialogCancel disabled={deletion.isPending}>إلغاء</AlertDialogCancel><Button variant="destructive" className="gap-2" disabled={deletion.isPending || !me.data?.isAdmin} onClick={() => { if (selected && me.data?.isAdmin) deletion.mutate(selected.id); }}>{deletion.isPending ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Trash2 className="size-4" />}حذف نهائياً</Button></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog></>;
}