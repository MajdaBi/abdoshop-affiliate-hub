import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Save, Mail, LockKeyhole, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageTitle } from "@/components/StatusBadge";
import { useMe } from "@/lib/session";
import { supabase } from "@/integrations/supabase/client";
import { profileSchema, emailSchema, passwordSchema } from "@/lib/account-settings";
import { saveAccountProfile, changeAccountPassword } from "@/lib/account-settings.functions";

export function AccountSettings() {
  const me = useMe();
  const qc = useQueryClient();
  const saveProfile = useServerFn(saveAccountProfile);
  const changePassword = useServerFn(changeAccountPassword);
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState({ current_password: "", password: "", confirmation: "" });
  const [busy, setBusy] = useState<"profile" | "email" | "password" | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  useEffect(() => {
    if (!me.data) return;
    setProfile({ full_name: me.data.profile?.full_name ?? "", phone: me.data.profile?.phone ?? "" });
    setEmail(me.data.email);
  }, [me.data]);
  const run = async (kind: NonNullable<typeof busy>, work: () => Promise<string>) => {
    setBusy(kind); setNotice(null);
    try { const text = await work(); setNotice({ error: false, text }); toast.success(text); }
    catch (error) { const text = error instanceof Error ? error.message : "تعذر حفظ التغييرات. حاول مرة أخرى."; setNotice({ error: true, text }); toast.error(text); }
    finally { setBusy(null); }
  };
  const submitProfile = (e: FormEvent) => {
    e.preventDefault();
    void run("profile", async () => {
      const data = profileSchema.safeParse(profile);
      if (!data.success) throw new Error(data.error.issues[0]?.message);
      await saveProfile({ data: data.data });
      await Promise.all([qc.invalidateQueries({ queryKey: ["me"] }), qc.invalidateQueries({ queryKey: ["affiliates"] }), qc.invalidateQueries({ queryKey: ["orders"] })]);
      return "تم حفظ معلومات الحساب";
    });
  };
  const submitEmail = (e: FormEvent) => {
    e.preventDefault();
    void run("email", async () => {
      const data = emailSchema.safeParse({ email });
      if (!data.success) throw new Error(data.error.issues[0]?.message);
      if (data.data.email.toLowerCase() === me.data?.email.toLowerCase()) throw new Error("أدخل بريداً مختلفاً عن البريد الحالي");
      const { error } = await supabase.auth.updateUser({ email: data.data.email }, { emailRedirectTo: `${window.location.origin}/auth` });
      if (error) throw new Error("تعذر إرسال طلب تغيير البريد. تحقق من العنوان وحاول مرة أخرى.");
      setPendingEmail(data.data.email);
      return "تم إرسال طلب تغيير البريد. تحقق من رسائل التأكيد في بريدك الحالي والجديد.";
    });
  };
  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    void run("password", async () => {
      const data = passwordSchema.safeParse(password);
      if (!data.success) throw new Error(data.error.issues[0]?.message);
      await changePassword({ data: data.data });
      setPassword({ current_password: "", password: "", confirmation: "" });
      return "تم تغيير كلمة السر";
    });
  };
  const disabled = busy !== null;
  const icon = (kind: NonNullable<typeof busy>) => busy === kind ? <Loader2 className="size-4 animate-spin motion-reduce:animate-none" /> : <Save className="size-4" />;
  if (me.isPending) return <p role="status" className="py-12 text-center">جاري تحميل الحساب…</p>;
  if (me.isError || !me.data?.profile) return <div role="alert" className="space-y-4 py-12 text-center"><p>تعذر تحميل الحساب.</p><Button onClick={() => me.refetch()}>إعادة المحاولة</Button></div>;
  return <div className="mx-auto max-w-2xl">
    <PageTitle title="إعدادات الحساب" />
    {notice && <p role={notice.error ? "alert" : "status"} className={`mb-5 break-words rounded-lg border p-3 text-sm ${notice.error ? "border-destructive text-destructive" : "border-success text-success"}`}>{notice.text}</p>}
    <section className="border-b pb-7">
      <h2 className="mb-4 text-lg font-bold">المعلومات الشخصية</h2>
      <form onSubmit={submitProfile} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="settings-name">الاسم الكامل</Label><Input id="settings-name" autoComplete="name" minLength={2} maxLength={100} required value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} disabled={disabled} /></div>
        <div className="space-y-1.5"><Label htmlFor="settings-phone">رقم الهاتف</Label><Input id="settings-phone" dir="ltr" type="tel" autoComplete="tel" minLength={8} maxLength={20} required value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} disabled={disabled} /></div>
        <p className="text-sm">حالة الحساب: <b className={me.data.profile.active ? "text-success" : "text-destructive"}>{me.data.profile.active ? "مفعّل" : "موقوف"}</b></p>
        <Button type="submit" disabled={disabled} className="gap-2">{icon("profile")} حفظ المعلومات</Button>
      </form>
    </section>
    <section className="border-b py-7">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Mail className="size-5" />البريد الإلكتروني</h2>
      <p className="mb-4 break-words text-sm text-muted-foreground">البريد الحالي: <b dir="ltr" className="inline-block">{me.data.email}</b></p>
      <form onSubmit={submitEmail} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="settings-email">البريد الإلكتروني الجديد</Label><Input id="settings-email" dir="ltr" type="email" autoComplete="email" maxLength={255} required value={email} onChange={(e) => setEmail(e.target.value)} disabled={disabled} /></div>
        {pendingEmail && <p role="status" className="break-words text-sm text-muted-foreground">في انتظار تأكيد: <span dir="ltr" className="inline-block">{pendingEmail}</span></p>}
        <Button type="submit" disabled={disabled} variant="outline" className="gap-2">{icon("email")} طلب تغيير البريد</Button>
      </form>
    </section>
    <section className="py-7">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><LockKeyhole className="size-5" />كلمة السر</h2>
      <form onSubmit={submitPassword} className="space-y-4">
        <div className="space-y-1.5"><Label htmlFor="settings-current-password">كلمة السر الحالية</Label><Input id="settings-current-password" dir="ltr" type="password" autoComplete="current-password" maxLength={100} required value={password.current_password} onChange={(e) => setPassword({ ...password, current_password: e.target.value })} disabled={disabled} /></div>
        <div className="space-y-1.5"><Label htmlFor="settings-new-password">كلمة السر الجديدة</Label><Input id="settings-new-password" dir="ltr" type="password" autoComplete="new-password" minLength={8} maxLength={100} required value={password.password} onChange={(e) => setPassword({ ...password, password: e.target.value })} disabled={disabled} /></div>
        <div className="space-y-1.5"><Label htmlFor="settings-confirm-password">تأكيد كلمة السر الجديدة</Label><Input id="settings-confirm-password" dir="ltr" type="password" autoComplete="new-password" minLength={8} maxLength={100} required value={password.confirmation} onChange={(e) => setPassword({ ...password, confirmation: e.target.value })} disabled={disabled} /></div>
        <Button type="submit" disabled={disabled} className="gap-2">{icon("password")} تغيير كلمة السر</Button>
      </form>
    </section>
  </div>;
}