import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeVisitRecord, statusLabel, visitDisplayName, type VisitRecord } from "@/lib/visits";
import { updateVisitStatusAction } from "@/app/(protected)/visits/actions";

export default async function TodayPage() {
  const supabase = await createSupabaseServerClient();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data } = await supabase
    .from("visits")
    .select("id,resident_id,house_id,type,visitor_name,eta_at,status,note,delivery_company,delivery_type,dropoff_location,instructions,contactless,created_at,house:houses(code)")
    .gte("eta_at", start.toISOString())
    .lt("eta_at", end.toISOString())
    .order("eta_at", { ascending: true });

  const visits = (data ?? []).map((visit) => normalizeVisitRecord(visit as unknown as VisitRecord));
  const upcoming = visits.filter((visit) => visit.status === "pending");
  const inProgress = visits.filter((visit) => visit.status === "arrived");

  const renderActions = (visit: VisitRecord) => (
    <div className="flex flex-wrap gap-2 pt-1">
      {visit.status === "pending" ? (
        <form action={updateVisitStatusAction}>
          <input type="hidden" name="visit_id" value={visit.id} />
          <input type="hidden" name="next_status" value="arrived" />
          <button className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-medium">Llegó</button>
        </form>
      ) : null}

      {visit.status === "arrived" ? (
        <>
          <form action={updateVisitStatusAction}>
            <input type="hidden" name="visit_id" value={visit.id} />
            <input type="hidden" name="next_status" value="authorized" />
            <button className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white">Autorizar</button>
          </form>
          {visit.type === "delivery" ? (
            <>
              <form action={updateVisitStatusAction}>
                <input type="hidden" name="visit_id" value={visit.id} />
                <input type="hidden" name="next_status" value="delivered_gate" />
                <button className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white">Entregar en caseta</button>
              </form>
              <form action={updateVisitStatusAction}>
                <input type="hidden" name="visit_id" value={visit.id} />
                <input type="hidden" name="next_status" value="sent_to_house" />
                <button className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium text-white">Enviar a casa</button>
              </form>
            </>
          ) : null}
        </>
      ) : null}

      {(visit.status === "pending" || visit.status === "arrived") ? (
        <form action={updateVisitStatusAction}>
          <input type="hidden" name="visit_id" value={visit.id} />
          <input type="hidden" name="next_status" value="rejected" />
          <button className="rounded-xl bg-rose-600 px-3 py-2 text-sm font-medium text-white">Rechazar</button>
        </form>
      ) : null}
    </div>
  );

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Guardia · Hoy</h1>
      <p className="text-sm text-slate-600">Visitas del día separadas por próximas y en curso.</p>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-slate-700">Próximas</h2>
        {upcoming.length === 0 ? (
          <article className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card">No hay visitas próximas.</article>
        ) : (
          upcoming.map((visit) => (
            <article key={visit.id} className="space-y-2 rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{visit.type === "delivery" ? "📦 Repartidor" : "👤 Visita"}</p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">{statusLabel(visit.status)}</span>
              </div>
              <p className="text-base font-medium">{visitDisplayName(visit)} · Casa {visit.house?.code ?? "-"}</p>
              <p className="text-sm text-slate-600">{new Date(visit.eta_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              {renderActions(visit)}
              <Link href={`/visits/${visit.id}`} className="block pt-1 text-sm font-medium text-brand">
                Ver detalle
              </Link>
            </article>
          ))
        )}
      </section>

      <section className="space-y-2">
        <h2 className="px-1 text-sm font-semibold text-slate-700">En curso</h2>
        {inProgress.length === 0 ? (
          <article className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card">No hay visitas en curso.</article>
        ) : (
          inProgress.map((visit) => (
            <article key={visit.id} className="space-y-2 rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{visit.type === "delivery" ? "📦 Repartidor" : "👤 Visita"}</p>
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">{statusLabel(visit.status)}</span>
              </div>
              <p className="text-base font-medium">{visitDisplayName(visit)} · Casa {visit.house?.code ?? "-"}</p>
              <p className="text-sm text-slate-600">{new Date(visit.eta_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              {renderActions(visit)}
              <Link href={`/visits/${visit.id}`} className="block pt-1 text-sm font-medium text-brand">
                Ver detalle
              </Link>
            </article>
          ))
        )}
      </section>
    </section>
  );
}
