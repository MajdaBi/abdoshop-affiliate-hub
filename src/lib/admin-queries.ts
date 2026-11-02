import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const affiliatesQuery = queryOptions({
  queryKey: ["affiliates"],
  queryFn: async () => {
    const [{ data: profiles, error }, { data: roles, error: roleError }] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (error) throw error;
    if (roleError) throw roleError;
    const admins = new Set(roles?.filter((r) => r.role === "admin").map((r) => r.user_id));
    return (profiles ?? []).filter((p) => !admins.has(p.id));
  },
});