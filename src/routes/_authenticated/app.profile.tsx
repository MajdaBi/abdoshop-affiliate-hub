import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle } from "@/components/StatusBadge";
import { pageHead } from "@/lib/page-head";

export const Route = createFileRoute("/_authenticated/app/profile")({ head: () => pageHead("حسابي", "معلومات حساب الأفلييت وحالة تفعيله."), component: Profile });

function Profile() {
  const me = useMe();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  useEffect(() => {
    if (me.data?.profile) { setName(me.data.profile.full_name); setPhone(me.data.profile.phone); }
  }, [me.data]);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!me.data) return;
    if (name.trim().length < 2) { toast.error("الاسم قصير"); return; }
    const { error } = await supabase.from("profiles").update({ full_name: name.trim().slice(0, 100), phone: phone.trim().slice(0, 20) }).eq("id", me.data.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ");
    qc.invalidateQueries({ queryKey: ["me"] });
  };
  return (
    <div className="mx-auto max-w-md">
      <PageTitle title="الحساب" />
      <form onSubmit={save} className="space-y-4 rounded-xl border bg-card p-5 shadow-soft">
        <div className="space-y-1.5"><Label>البريد الإلكتروني</Label><Input dir="ltr" value={me.data?.email ?? ""} disabled /></div>
        <div className="space-y-1.5"><Label>الاسم الكامل</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>رقم الهاتف</Label><Input dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
        <p className="text-sm">حالة الحساب: <b className={me.data?.profile?.active ? "text-success" : "text-destructive"}>{me.data?.profile?.active ? "مفعّل" : "موقوف"}</b></p>
        <Button type="submit" className="w-full">حفظ</Button>
      </form>
    </div>
  );
}
