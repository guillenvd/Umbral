import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { Button } from "@/components/ui/button";
import { getCurrentSession, getCurrentUserRole } from "@/lib/auth/session";
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
      <BottomNav role={role} />
    </div>
  );
}
