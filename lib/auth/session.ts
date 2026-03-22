import { DEFAULT_ROLE, type AppRole, isAppRole } from "@/lib/auth/roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getCurrentSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { session }
  } = await supabase.auth.getSession();

  return session;
}

export async function getCurrentUserRole(): Promise<AppRole> {
  const session = await getCurrentSession();

  if (!session?.user) {
    return DEFAULT_ROLE;
  }

  const metadataRole = session.user.user_metadata?.role;
  if (typeof metadataRole === "string" && isAppRole(metadataRole)) {
    return metadataRole;
  }

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  return isAppRole(data?.role) ? data.role : DEFAULT_ROLE;
}
