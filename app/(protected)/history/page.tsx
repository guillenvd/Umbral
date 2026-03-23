import Link from "next/link";
import { getCurrentSession, getCurrentUserRole } from "@/lib/auth/session";
import { logServerError } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cancelVisitAction } from "@/app/(protected)/visits/actions";
import { expireStaleVisits, isTerminalStatus, normalizeVisitRecord, statusBadgeClass, statusLabel, visitDisplayName, type VisitRecord } from "@/lib/visits";
import { RealtimeVisitsSync } from "@/components/visits/realtime-sync";
import { ActionSubmit } from "@/components/visits/action-submit";

type HistoryPageProps = {
  searchParams: Promise<{ tab?: string; ok?: string; error?: string; page?: string }>;
};

export default async function HistoryPage({ searchParams }: HistoryPageProps) {
  const params = await searchParams;
  const tab = params.tab === "past" ? "past" : "active";
  const page = Number(params.page ?? "1");
  const currentPage = Number.isFinite(page) && page > 0 ? page : 1;
  const PAGE_SIZE = 25;
  const role = await getCurrentUserRole();
  const session = await getCurrentSession();
  const supabase = await createSupabaseServerClient();
  await expireStaleVisits(supabase);

  let query = supabase
    .from("visits")
    .select("id,resident_id,house_id,type,visitor_name,eta_at,status,note,delivery_company,delivery_type,dropoff_location,instructions,contactless,created_at,house:houses(code)")
    .order("eta_at", { ascending: false })
    .range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

  if (role === "resident" && session?.user?.id) {
    query = query.eq("resident_id", session.user.id);
  }

  const { data: visits, error: visitsError } = await query;
  if (visitsError) {
    logServerError("historyPage.fetchVisits", visitsError, { role, currentPage });
  }
  const filtered = (visits ?? []).map((visit) => normalizeVisitRecord(visit as unknown as VisitRecord)).filter((visit) => {
    const terminal = isTerminalStatus(visit.status);
    return tab === "active" ? !terminal : terminal;
  });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Historial</h1>
      <RealtimeVisitsSync channelName="visits-history" />
      {params.ok ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Acción aplicada correctamente.</p> : null}
      {params.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p> : null}
      {visitsError ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">No pudimos cargar el historial.</p> : null}
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1 shadow-card">
        <Link href="/history?tab=active" className={`rounded-xl px-3 py-2 text-center text-sm font-medium ${tab === "active" ? "bg-brand text-white" : "text-slate-700"}`}>
          Activas
        </Link>
        <Link href="/history?tab=past" className={`rounded-xl px-3 py-2 text-center text-sm font-medium ${tab === "past" ? "bg-brand text-white" : "text-slate-700"}`}>
          Pasadas
        </Link>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <article className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card">Sin visitas para este filtro.</article>
        ) : (
          filtered.map((visit) => (
            <article key={visit.id} className="space-y-2 rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{visit.type === "delivery" ? "📦 Repartidor" : "👤 Visita"}</p>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusBadgeClass(visit.status)}`}>{statusLabel(visit.status)}</span>
              </div>
              <p className="text-base font-medium">{visitDisplayName(visit)}</p>
              <p className="text-sm text-slate-600">
                {new Date(visit.eta_at).toLocaleString()} · Casa {visit.house?.code ?? "-"}
              </p>
              <div className="flex items-center gap-2 pt-1">
                <Link href={`/visits/${visit.id}`} className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium">
                  Ver detalle
                </Link>
                {role === "resident" && visit.status === "pending" ? (
                  <form action={cancelVisitAction}>
                    <input type="hidden" name="visit_id" value={visit.id} />
                    <input type="hidden" name="redirect_to" value="/history?tab=active" />
                    <ActionSubmit
                      className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-70"
                      confirmMessage="¿Seguro que quieres cancelar esta visita?"
                    >
                      Cancelar
                    </ActionSubmit>
                  </form>
                ) : null}
              </div>
            </article>
          ))
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link
          href={`/history?tab=${tab}&page=${Math.max(1, currentPage - 1)}`}
          className={`rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-medium ${currentPage <= 1 ? "pointer-events-none opacity-40" : ""}`}
        >
          Anterior
        </Link>
        <Link
          href={`/history?tab=${tab}&page=${currentPage + 1}`}
          className={`rounded-xl border border-slate-300 px-3 py-2 text-center text-sm font-medium ${(visits ?? []).length < PAGE_SIZE ? "pointer-events-none opacity-40" : ""}`}
        >
          Siguiente
        </Link>
      </div>
    </section>
  );
}
