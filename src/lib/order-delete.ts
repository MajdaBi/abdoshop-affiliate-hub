import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

export async function deleteAdminOrder(id: string) {
  const orderId = z.string().uuid().parse(id);
  // Existing database RLS is the authority: affiliates cannot delete any row.
  // Reading the deleted ID also distinguishes a denied/missing row from success.
  const { data, error } = await supabase.from("orders").delete().eq("id", orderId).select("id").single();
  if (error || data?.id !== orderId) throw new Error("تعذر حذف الطلب. حاول مرة أخرى.");
  return data.id;
}