import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPrimaryGuardUserId() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "guard")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}
