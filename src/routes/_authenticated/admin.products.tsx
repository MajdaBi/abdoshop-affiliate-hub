import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Package } from "lucide-react";
import { productsQuery, type Product } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { pageHead } from "@/lib/page-head";
import { dh } from "@/lib/commission";
import { PageTitle } from "@/components/StatusBadge";
import { AdminError, AdminNotFound } from "@/components/AdminStates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/products")({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery),
  head: () => pageHead("إدارة المنتجات", "إضافة المنتجات وتعديل أسعارها وعمولاتها وتوفرها."),
  errorComponent: AdminError, notFoundComponent: AdminNotFound, component: Products,
});
const empty = { name: "", description: "", image_url: "", price: "", commission: "", colors: "", sizes: "", active: true };
const schema = z.object({ name: z.string().trim().min(2).max(150), description: z.string().max(4000), image_url: z.string().refine((v) => !v || /^https:\/\//.test(v) || /^\/images\//.test(v), "استعمل رابط صورة HTTPS"), price: z.coerce.number().positive().max(100000), commission: z.coerce.number().nonnegative().max(100000), active: z.boolean() });
function Products() {
  const { data } = useSuspenseQuery(productsQuery);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [id, setId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const edit = (p?: Product) => {
    setId(p?.id ?? null);
    setForm(p ? { name: p.name, description: p.description, image_url: p.image_url, price: String(p.price), commission: String(p.commission), colors: p.colors.join(", "), sizes: p.sizes.join(", "), active: p.active } : empty);
    setOpen(true);
  };
  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) { toast.error(parsed.error.issues[0]?.message ?? "راجع معلومات المنتج"); return; }
    const split = (v: string) => [...new Set(v.split(/[,،]/).map((s) => s.trim()).filter(Boolean))];
    const values = { ...parsed.data, colors: split(form.colors), sizes: split(form.sizes) };
    setBusy(true);
    try {
      const result = id ? await supabase.from("products").update(values).eq("id", id).select("id").single() : await supabase.from("products").insert(values).select("id").single();
      if (result.error) throw result.error;
      await qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false); toast.success("تم حفظ المنتج");
    } catch { toast.error("تعذر حفظ المنتج"); } finally { setBusy(false); }
  };
  return <><div className="flex items-start justify-between gap-3"><PageTitle title="إدارة المنتجات" /><Button onClick={() => edit()}><Plus className="size-4" /> إضافة منتج</Button></div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((p) => <article key={p.id} className="overflow-hidden rounded-lg border bg-card">
      {p.image_url ? <img src={p.image_url} alt={p.name} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-muted"><Package className="size-12 text-muted-foreground" /></div>}
      <div className="p-4"><div className="flex items-start justify-between gap-2"><h2 className="font-bold">{p.name}</h2><span className={`shrink-0 text-xs ${p.active ? "text-success" : "text-muted-foreground"}`}>{p.active ? "متوفر" : "مخفي"}</span></div><p className="mt-2 text-sm">{dh(p.price)} · عمولة {dh(p.commission)}</p><Button variant="outline" className="mt-4 w-full" onClick={() => edit(p)}><Pencil className="size-4" /> تعديل</Button></div>
    </article>)}</div>{!data.length && <p className="py-12 text-center text-muted-foreground">ما كاين حتى منتج.</p>}
    <Dialog open={open} onOpenChange={(v) => { if (!busy) setOpen(v); }}><DialogContent dir="rtl" className="max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>{id ? "تعديل المنتج" : "إضافة منتج"}</DialogTitle></DialogHeader>
      <form onSubmit={save} className="space-y-4">
        <div className="space-y-1"><Label htmlFor="product-name">اسم المنتج</Label><Input id="product-name" required value={form.name} onChange={set("name")} /></div>
        <div className="space-y-1"><Label htmlFor="product-description">الوصف</Label><Textarea id="product-description" value={form.description} onChange={set("description")} /></div>
        <div className="space-y-1"><Label htmlFor="product-image">رابط الصورة</Label><Input id="product-image" dir="ltr" value={form.image_url} onChange={set("image_url")} /></div>
        <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label htmlFor="product-price">الثمن (DH)</Label><Input id="product-price" type="number" min="0.01" step="0.01" required value={form.price} onChange={set("price")} /></div><div className="space-y-1"><Label htmlFor="product-commission">العمولة (DH)</Label><Input id="product-commission" type="number" min="0" step="0.01" required value={form.commission} onChange={set("commission")} /></div></div>
        <div className="space-y-1"><Label htmlFor="product-colors">الألوان</Label><Input id="product-colors" placeholder="أسود، أبيض" value={form.colors} onChange={set("colors")} /></div>
        <div className="space-y-1"><Label htmlFor="product-sizes">المقاسات</Label><Input id="product-sizes" placeholder="S, M, L" value={form.sizes} onChange={set("sizes")} /></div>
        <label className="flex items-center justify-between"><span>المنتج متوفر</span><Switch checked={form.active} onCheckedChange={(active) => setForm((f) => ({ ...f, active }))} /></label>
        <Button type="submit" disabled={busy} className="w-full">{busy ? "جاري الحفظ…" : "حفظ المنتج"}</Button>
      </form>
    </DialogContent></Dialog>
  </>;
}