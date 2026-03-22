import { notFound } from "next/navigation";
import { getCurrentSession, getCurrentUserRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeVisitRecord, statusLabel, visitDisplayName, type VisitRecord } from "@/lib/visits";
import { cancelVisitAction, updateVisitStatusAction } from "@/app/(protected)/visits/actions";

type VisitDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function VisitDetailPage({ params }: VisitDetailProps) {
  const { id } = await params;
  const session = await getCurrentSession();
  const role = await getCurrentUserRole();
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("visits")
    .select("id,resident_id,house_id,type,visitor_name,eta_at,status,note,delivery_company,delivery_type,dropoff_location,instructions,contactless,created_at,house:houses(code)")
    .eq("id", id)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const visit = normalizeVisitRecord(data as unknown as VisitRecord);
  const canGuard = role === "guard" || role === "admin";
  const canCancel = role === "resident" && session?.user?.id === visit.resident_id && visit.status === "pending";

  return (
    <section className="space-y-4 pb-24">
      <h1 className="text-xl font-semibold">Detalle de visita</h1>

      <article className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">{visit.type === "delivery" ? "📦 Repartidor" : "👤 Visita"}</p>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{statusLabel(visit.status)}</span>
        </div>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Nombre/empresa:</span> {visitDisplayName(visit)}</p>
          <p><span className="font-medium">Casa:</span> {visit.house?.code ?? "-"}</p>
          <p><span className="font-medium">Hora estimada:</span> {new Date(visit.eta_at).toLocaleString()}</p>
          {visit.note ? <p><span className="font-medium">Notas:</span> {visit.note}</p> : null}
          {visit.delivery_type ? <p><span className="font-medium">Tipo entrega:</span> {visit.delivery_type}</p> : null}
          {visit.instructions ? <p><span className="font-medium">Instrucciones:</span> {visit.instructions}</p> : null}
          {visit.dropoff_location ? <p><span className="font-medium">Entrega:</span> {visit.dropoff_location === "gate" ? "Caseta" : "Casa"}</p> : null}
          {visit.type === "delivery" ? <p><span className="font-medium">Sin contacto:</span> {visit.contactless ? "Sí" : "No"}</p> : null}
        </div>
      </article>

      {(canGuard || canCancel) ? (
        <div className="fixed inset-x-0 bottom-16 z-40 mx-auto flex w-full max-w-md gap-2 border-t border-slate-200 bg-white p-3">
          {canGuard && visit.status === "pending" ? (
            <form action={updateVisitStatusAction} className="flex-1">
              <input type="hidden" name="visit_id" value={visit.id} />
              <input type="hidden" name="next_status" value="arrived" />
              <button className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm font-medium">Llegó</button>
            </form>
          ) : null}

          {canGuard && visit.status === "arrived" ? (
            <form action={updateVisitStatusAction} className="flex-1">
              <input type="hidden" name="visit_id" value={visit.id} />
              <input type="hidden" name="next_status" value="authorized" />
              <button className="w-full rounded-xl bg-emerald-600 px-3 py-3 text-sm font-medium text-white">Autorizar</button>
            </form>
          ) : null}

          {canGuard && (visit.status === "pending" || visit.status === "arrived") ? (
            <form action={updateVisitStatusAction} className="flex-1">
              <input type="hidden" name="visit_id" value={visit.id} />
              <input type="hidden" name="next_status" value="rejected" />
              <button className="w-full rounded-xl bg-rose-600 px-3 py-3 text-sm font-medium text-white">Rechazar</button>
            </form>
          ) : null}

          {canCancel ? (
            <form action={cancelVisitAction} className="flex-1">
              <input type="hidden" name="visit_id" value={visit.id} />
              <button className="w-full rounded-xl bg-rose-600 px-3 py-3 text-sm font-medium text-white">Cancelar</button>
            </form>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
