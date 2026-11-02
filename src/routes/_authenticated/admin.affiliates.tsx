import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { affiliatesQuery } from "@/lib/admin-queries";
import { supabase } from "@/integrations/supabase/client";
import { PageTitle } from "@/components/StatusBadge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { AdminError, AdminNotFound } from "@/components/AdminStates";
import { pageHead } from "@/lib/page-head";
import { fmtDate } from "@/lib/commission";

export const Route = createFileRoute("/_authenticated/admin/affiliates")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  loader: ({ context }) => context.queryClient.ensureQueryData(affiliatesQuery),
  head: () => pageHead("الأفلييتات", "إدارة حسابات الأفلييتات وتفعيلها أو إيقافها."),
  errorComponent: AdminError, notFoundComponent: AdminNotFound, component: Affiliates,
});

function Affiliates() {
  const { data } = useSuspenseQuery(affiliatesQuery);
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("profiles").update({ active }).eq("id", id).select("id").single();
      if (error) throw error;
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["affiliates"] }); toast.success("تم تحديث الحساب"); },
    onError: () => toast.error("تعذر تحديث الحساب"),
  });
  const list = data.filter((a) => `${a.full_name} ${a.email} ${a.phone}`.toLowerCase().includes(q.toLowerCase()));
  return <><PageTitle title="الأفلييتات" /><Input aria-label="البحث عن أفلييت" placeholder="بحث بالاسم، البريد أو الهاتف" value={q} onChange={(e) => navigate({ search: { q: e.target.value }, replace: true })} className="mb-5 max-w-md" />
    <div className="divide-y border-y">{list.map((a) => <div key={a.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
      <div className="min-w-0"><h2 className="font-bold">{a.full_name || "—"}</h2><p dir="ltr" className="break-all text-sm text-muted-foreground">{a.email}</p><p className="text-sm">{a.phone || "—"} · {fmtDate(a.created_at)}</p></div>
      <label className="flex items-center gap-3 text-sm"><span>{a.active ? "نشيط" : "موقوف"}</span><Switch aria-label={`تفعيل ${a.full_name || a.email}`} checked={a.active} disabled={mutation.isPending} onCheckedChange={(active) => mutation.mutate({ id: a.id, active })} /></label>
    </div>)}</div>{!list.length && <p className="py-12 text-center text-muted-foreground">ما كاين حتى أفلييت.</p>}
  </>;
}