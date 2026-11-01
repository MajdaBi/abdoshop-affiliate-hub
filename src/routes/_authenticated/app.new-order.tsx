import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageTitle } from "@/components/StatusBadge";
import { productsQuery } from "@/lib/queries";
import { dh } from "@/lib/commission";

export const Route = createFileRoute("/_authenticated/app/new-order")({
  validateSearch: (s: Record<string, unknown>): { product?: string } => (typeof s["product"] === "string" ? { product: s["product"] } : {}),
  component: NewOrder,
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "اسم الزبون ضروري").max(100),
  customer_phone: z.string().trim().regex(/^[+0-9 ]{8,20}$/, "رقم الهاتف غير صحيح"),
  city: z.string().trim().min(2, "المدينة ضرورية").max(80),
  address: z.string().trim().min(5, "العنوان ضروري").max(300),
  product_id: z.string().uuid("اختار المنتج"),
  color: z.string().max(50),
  size: z.string().max(20),
  quantity: z.coerce.number().int().min(1).max(100),
  selling_price: z.coerce.number().min(1, "ثمن البيع ضروري").max(100000),
});

const empty = { customer_name: "", customer_phone: "", city: "", address: "", color: "", size: "", quantity: "1", selling_price: "" };

function NewOrder() {
  const search = Route.useSearch();
  const qc = useQueryClient();
  const { data: products = [] } = useQuery(productsQuery);
  const [f, setF] = useState({ ...empty, product_id: search.product ?? "" });
  const [step, setStep] = useState<"form" | "review" | "done">("form");
  const [busy, setBusy] = useState(false);
  const [orderNo, setOrderNo] = useState("");
  const product = products.find((p) => p.id === f.product_id);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const review = (e: React.FormEvent) => {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) { toast.error(p.error.issues[0]?.message ?? "خطأ"); return; }
    if (product?.colors.length && !f.color) { toast.error("اختار اللون"); return; }
    if (product?.sizes.length && !f.size) { toast.error("اختار المقاس"); return; }
    setStep("review");
  };

  const submit = async () => {
    const p = schema.parse(f);
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase.from("orders").insert({ ...p, affiliate_id: u.user!.id }).select("order_number").single();
    setBusy(false);
    if (error) { toast.error("ما تقدرش تزيد الطلب: " + error.message); return; }
    setOrderNo(data.order_number);
    qc.invalidateQueries({ queryKey: ["orders"] });
    setStep("done");
  };

  if (step === "done")
    return (
      <div className="mx-auto max-w-md rounded-2xl border bg-card p-8 text-center shadow-soft">
        <CheckCircle2 className="mx-auto size-14 text-success" />
        <h1 className="mt-3 text-2xl font-bold">تم إرسال الطلب بنجاح</h1>
        <p className="mt-2 text-muted-foreground">رقم الطلب</p>
        <p className="text-3xl font-bold" dir="ltr">{orderNo}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => { setF({ ...empty, product_id: "" }); setStep("form"); }}>إضافة طلب آخر</Button>
          <Button asChild variant="outline"><Link to="/app/orders">شوف طلباتي</Link></Button>
        </div>
      </div>
    );

  if (step === "review" && product)
    return (
      <div className="mx-auto max-w-lg">
        <PageTitle title="ملخص الطلب" sub="تأكد من المعلومات قبل الإرسال" />
        <div className="space-y-2 rounded-xl border bg-card p-5 text-sm shadow-soft">
          {[
            ["الزبون", f.customer_name], ["الهاتف", f.customer_phone], ["المدينة", f.city], ["العنوان", f.address],
            ["المنتج", product.name], ["اللون", f.color || "—"], ["المقاس", f.size || "—"], ["الكمية", f.quantity],
            ["ثمن البيع", dh(f.selling_price)], ["العمولة المتوقعة", dh(product.commission * Number(f.quantity))],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b py-1.5 last:border-0"><span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span></div>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="gold" size="lg" className="flex-1" onClick={submit} disabled={busy}>{busy ? "..." : "تأكيد وإرسال"}</Button>
          <Button variant="outline" size="lg" onClick={() => setStep("form")}>تعديل</Button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-lg">
      <PageTitle title="إضافة طلب" sub="عمّر معلومات الزبون والمنتج" />
      <form onSubmit={review} className="space-y-5">
        <fieldset className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
          <legend className="px-1 font-bold">معلومات الزبون</legend>
          <div className="space-y-1.5"><Label>الاسم الكامل</Label><Input value={f.customer_name} onChange={set("customer_name")} /></div>
          <div className="space-y-1.5"><Label>رقم الهاتف</Label><Input dir="ltr" type="tel" inputMode="tel" value={f.customer_phone} onChange={set("customer_phone")} /></div>
          <div className="space-y-1.5"><Label>المدينة</Label><Input value={f.city} onChange={set("city")} /></div>
          <div className="space-y-1.5"><Label>العنوان بالتفصيل</Label><Textarea value={f.address} onChange={set("address")} /></div>
        </fieldset>
        <fieldset className="space-y-3 rounded-xl border bg-card p-4 shadow-soft">
          <legend className="px-1 font-bold">معلومات المنتج</legend>
          <div className="space-y-1.5">
            <Label>المنتج</Label>
            <Select value={f.product_id} onValueChange={(v) => { const p = products.find((x) => x.id === v); setF({ ...f, product_id: v, color: "", size: "", selling_price: p ? String(p.price) : "" }); }}>
              <SelectTrigger><SelectValue placeholder="اختار المنتج" /></SelectTrigger>
              <SelectContent>{products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name} — {dh(p.price)}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {product && product.colors.length > 0 && (
            <div className="space-y-1.5">
              <Label>اللون</Label>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <Button key={c} type="button" size="sm" variant={f.color === c ? "default" : "outline"} onClick={() => setF({ ...f, color: c })}>{c}</Button>
                ))}
              </div>
            </div>
          )}
          {product && product.sizes.length > 0 && (
            <div className="space-y-1.5">
              <Label>المقاس</Label>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <Button key={s} type="button" size="sm" variant={f.size === s ? "default" : "outline"} onClick={() => setF({ ...f, size: s })}>{s}</Button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label>الكمية</Label><Input type="number" min={1} inputMode="numeric" value={f.quantity} onChange={set("quantity")} /></div>
            <div className="space-y-1.5"><Label>ثمن البيع (DH)</Label><Input type="number" min={1} inputMode="decimal" value={f.selling_price} onChange={set("selling_price")} /></div>
          </div>
        </fieldset>
        <Button type="submit" size="lg" variant="gold" className="w-full">مراجعة الطلب</Button>
      </form>
    </div>
  );
}
