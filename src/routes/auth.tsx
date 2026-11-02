import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getRoleHome } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: "register" } => (s["mode"] === "register" ? { mode: "register" } : {}),
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — ABDO SHOP" },
      { name: "description", content: "ادخل لحسابك أو أنشئ حساب أفلييت جديد في ABDO SHOP." },
      { property: "og:title", content: "تسجيل الدخول — ABDO SHOP" },
      { property: "og:description", content: "ادخل لحسابك أو أنشئ حساب أفلييت جديد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const registerSchema = z.object({
  full_name: z.string().trim().min(2, "الاسم قصير").max(100),
  phone: z.string().trim().min(8, "رقم الهاتف غير صحيح").max(20),
  email: z.string().trim().email("بريد غير صحيح").max(255),
  password: z.string().min(6, "كلمة السر خاصها 6 حروف على الأقل").max(100),
});

function AuthPage() {
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "register">(search.mode ?? "login");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        const p = registerSchema.safeParse(form);
        if (!p.success) return void toast.error(p.error.issues[0]?.message ?? "خطأ");
        const { error } = await supabase.auth.signUp({
          email: p.data.email,
          password: p.data.password,
          options: { emailRedirectTo: window.location.origin + "/auth", data: { full_name: p.data.full_name, phone: p.data.phone } },
        });
        if (error) return void toast.error(error.message);
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
        if (error) return void toast.error("البريد أو كلمة السر غير صحيحة");
        const home = await getRoleHome();
        navigate({ to: home ?? "/app" });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-soft md:p-8">
        <Link to="/" className="font-display text-2xl font-bold">ABDO SHOP</Link>
        {sent ? (
          <div className="mt-6 space-y-3">
            <h1 className="text-xl font-bold">تحقق من بريدك الإلكتروني</h1>
            <p className="text-sm text-muted-foreground">صيفطنا ليك رابط التأكيد. ضغط عليه باش تفعّل الحساب ديالك، ومن بعد سجّل الدخول.</p>
            <Button variant="outline" onClick={() => { setSent(false); setMode("login"); }}>رجوع لتسجيل الدخول</Button>
          </div>
        ) : (
          <>
            <h1 className="mt-4 text-xl font-bold">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب أفلييت"}</h1>
            <form onSubmit={submit} className="mt-5 space-y-4">
              {mode === "register" && (
                <>
                  <div className="space-y-1.5"><Label>الاسم الكامل</Label><Input value={form.full_name} onChange={set("full_name")} required /></div>
                  <div className="space-y-1.5"><Label>رقم الهاتف</Label><Input dir="ltr" type="tel" value={form.phone} onChange={set("phone")} required /></div>
                </>
              )}
              <div className="space-y-1.5"><Label>البريد الإلكتروني</Label><Input dir="ltr" type="email" value={form.email} onChange={set("email")} required /></div>
              <div className="space-y-1.5"><Label>كلمة السر</Label><Input dir="ltr" type="password" value={form.password} onChange={set("password")} required /></div>
              <Button type="submit" size="lg" className="w-full" disabled={busy}>
                {busy ? "..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
              </Button>
            </form>
            <button className="mt-4 w-full text-center text-sm text-muted-foreground underline" onClick={() => setMode(mode === "login" ? "register" : "login")}>
              {mode === "login" ? "ما عندكش حساب؟ سجّل دابا" : "عندك حساب؟ دخول"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
