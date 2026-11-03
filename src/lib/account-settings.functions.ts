import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { profileSchema, passwordSchema, verifyThenChangePassword } from "./account-settings";

export const saveAccountProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => profileSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId).select("id").single();
    if (error) throw new Error("تعذر حفظ معلومات الحساب. حاول مرة أخرى.");
    return { saved: true };
  });

export const changeAccountPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => passwordSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: userData, error } = await context.supabase.auth.getUser();
    const email = userData.user?.email;
    if (error || !email || userData.user?.id !== context.userId) throw new Error("تعذر التحقق من الحساب");
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
    if (!url || !key) throw new Error("تعذر الاتصال بخدمة الحسابات");
    const verifier = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    await verifyThenChangePassword(data, async (password) => {
      const result = await verifier.auth.signInWithPassword({ email, password });
      return !result.error && result.data.user?.id === context.userId;
    }, async (password, current_password) => {
      const result = await verifier.auth.updateUser({ password, current_password });
      if (result.error) throw new Error("تعذر تغيير كلمة السر. تحقق من شروط كلمة السر وحاول مرة أخرى.");
    });
    return { saved: true };
  });