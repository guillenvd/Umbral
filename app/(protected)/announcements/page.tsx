import Link from "next/link";
import { RealtimeAnnouncementsSync } from "@/components/announcements/realtime-announcements-sync";
import { getCurrentUserRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getPriorityBadge(priority: string) {
  if (priority === "urgent") return "bg-rose-100 text-rose-700";
  if (priority === "important") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-700";
}

function getPriorityLabel(priority: string) {
  if (priority === "urgent") return "Urgente";
  if (priority === "important") return "Importante";
  return "Normal";
}

export default async function AnnouncementsPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const ok = typeof params.ok === "string" ? params.ok : undefined;
  const role = await getCurrentUserRole();
  const canCreate = role === "committee" || role === "admin";
  const supabase = await createSupabaseServerClient();

  const { data: announcements } = await supabase
    .from("announcements")
    .select("id,title,body,priority,created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  return (
    <section className="space-y-3 pb-24">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold">Comunicados</h1>
        <RealtimeAnnouncementsSync />
      </header>

      {ok === "created" ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Comunicado publicado correctamente.</p>
      ) : null}

      <div className="space-y-3">
        {announcements?.length ? (
          announcements.map((item) => (
            <article key={item.id} className="space-y-2 rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold leading-tight">{item.title}</h2>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadge(item.priority)}`}>
                  {getPriorityLabel(item.priority)}
                </span>
              </div>
              <p className="line-clamp-3 text-sm text-slate-700">{item.body}</p>
              <p className="text-xs text-slate-500">
                {new Date(item.created_at).toLocaleString("es-MX", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </p>
            </article>
          ))
        ) : (
          <article className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card">
            No hay comunicados publicados aún.
          </article>
        )}
      </div>

      {canCreate ? (
        <Link
          href="/announcements/new"
          className="fixed bottom-20 left-1/2 inline-flex min-h-11 w-[calc(100%-2rem)] max-w-[420px] -translate-x-1/2 items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
        >
          Nuevo comunicado
        </Link>
      ) : null}
    </section>
  );
}
