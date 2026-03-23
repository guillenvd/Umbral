import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { Button } from "@/components/ui/button";
import { getCurrentSession, getCurrentUserRole } from "@/lib/auth/session";
import { buildUnreadMap } from "@/lib/chat";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();
  const supabase = await createSupabaseServerClient();
  let unreadMessages = 0;

  if (role === "resident" || role === "guard") {
    const { data: messageRows } = await supabase
      .from("messages")
      .select("from_user,to_user,created_at")
      .or(`from_user.eq.${session.user.id},to_user.eq.${session.user.id}`)
      .order("created_at", { ascending: false })
      .limit(200);
    const { data: readRows } = await supabase
      .from("conversation_reads")
      .select("peer_id,last_read_at")
      .eq("user_id", session.user.id);

    const unreadByPeer = buildUnreadMap(
      session.user.id,
      (messageRows ?? []) as Array<{ from_user: string; to_user: string; created_at: string }>,
      (readRows ?? []) as Array<{ peer_id: string; last_read_at: string }>
    );
    unreadMessages = Array.from(unreadByPeer.values()).reduce((acc, count) => acc + count, 0);
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Umbral</p>
            <p className="text-sm font-semibold">Rol: {role}</p>
          </div>
          <form action={signOut}>
            <Button type="submit" variant="secondary" className="min-h-9 px-3 py-1.5 text-xs">
              Salir
            </Button>
          </form>
        </div>
      </header>

      <main className="px-4 pb-24 pt-4">{children}</main>
      <BottomNav role={role} unreadMessages={unreadMessages} />
    </div>
  );
}
