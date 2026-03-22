"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentSession, getCurrentUserRole } from "@/lib/auth/session";
import { isVisitStatus, isVisitType, type VisitStatus, type VisitType } from "@/lib/visits";

async function getCurrentHouseId(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("house_members")
    .select("house_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return data?.house_id ?? null;
}

function canTransition(current: VisitStatus, next: VisitStatus, type: VisitType) {
  if (next === "rejected") {
    return current === "pending" || current === "arrived";
  }

  if (current === "pending") {
    return next === "arrived" || next === "cancelled";
  }

  if (current === "arrived") {
    if (type === "delivery") {
      return next === "authorized" || next === "delivered_gate" || next === "sent_to_house";
    }
    return next === "authorized";
  }

  return false;
}

export async function createVisitAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();
  if (role !== "resident") {
    redirect("/unauthorized");
  }

  const typeRaw = String(formData.get("type") ?? "visitor");
  if (!isVisitType(typeRaw)) {
    redirect("/visits/new?error=Tipo%20de%20visita%20inválido");
  }

  const type = typeRaw;
  const etaRaw = String(formData.get("eta_at") ?? "");
  const etaDate = new Date(etaRaw);
  if (!etaRaw || Number.isNaN(etaDate.getTime())) {
    redirect("/visits/new?error=Hora%20estimada%20inválida");
  }

  const visitorName = String(formData.get("visitor_name") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const deliveryCompany = String(formData.get("delivery_company") ?? "").trim();
  const deliveryType = String(formData.get("delivery_type") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const dropoffLocationRaw = String(formData.get("dropoff_location") ?? "").trim();
  const contactless = formData.get("contactless") === "on";

  if (type === "visitor" && !visitorName) {
    redirect("/visits/new?error=El%20nombre%20del%20visitante%20es%20obligatorio");
  }
  if (type === "delivery" && !dropoffLocationRaw) {
    redirect("/visits/new?error=La%20ubicación%20de%20entrega%20es%20obligatoria");
  }
  if (type === "delivery" && !["gate", "house"].includes(dropoffLocationRaw)) {
    redirect("/visits/new?error=Ubicación%20de%20entrega%20inválida");
  }
  if (type === "delivery" && !deliveryType) {
    redirect("/visits/new?error=El%20tipo%20de%20entrega%20es%20obligatorio");
  }
  if (type === "delivery" && !instructions) {
    redirect("/visits/new?error=Las%20instrucciones%20son%20obligatorias");
  }

  const houseId = await getCurrentHouseId(session.user.id);
  if (!houseId) {
    redirect("/visits/new?error=No%20se%20encontró%20vivienda%20activa");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("visits").insert({
    house_id: houseId,
    resident_id: session.user.id,
    type,
    visitor_name: type === "visitor" ? visitorName : visitorName || null,
    eta_at: etaDate.toISOString(),
    note: note || null,
    delivery_company: type === "delivery" ? deliveryCompany || null : null,
    delivery_type: type === "delivery" ? deliveryType || null : null,
    dropoff_location: type === "delivery" ? dropoffLocationRaw : null,
    instructions: type === "delivery" ? instructions || null : null,
    contactless: type === "delivery" ? contactless : false,
    status: "pending"
  });

  if (error) {
    redirect(`/visits/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/history");
  revalidatePath("/today");
  redirect("/history?tab=active&ok=created");
}

export async function updateVisitStatusAction(formData: FormData) {
  const redirectTo = String(formData.get("redirect_to") ?? "/today");
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();
  if (!(role === "guard" || role === "admin")) {
    redirect("/unauthorized");
  }

  const visitId = String(formData.get("visit_id") ?? "");
  const statusRaw = String(formData.get("next_status") ?? "");
  if (!visitId || !isVisitStatus(statusRaw)) {
    redirect(`${redirectTo}?error=Solicitud%20inválida`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: visit, error: visitError } = await supabase
    .from("visits")
    .select("id,status,type")
    .eq("id", visitId)
    .single();

  if (visitError || !visit || !isVisitStatus(visit.status) || !isVisitType(visit.type)) {
    redirect(`${redirectTo}?error=Visita%20no%20encontrada`);
  }

  if (!canTransition(visit.status, statusRaw, visit.type)) {
    redirect(`${redirectTo}?error=Transición%20de%20estado%20inválida`);
  }

  const payload: Record<string, string | null> = {
    status: statusRaw
  };

  if (statusRaw === "arrived") {
    payload.arrived_at = new Date().toISOString();
  }

  if (["authorized", "rejected", "delivered_gate", "sent_to_house"].includes(statusRaw)) {
    payload.decided_at = new Date().toISOString();
    payload.decided_by = session.user.id;
  }

  const { error } = await supabase.from("visits").update(payload).eq("id", visitId);
  if (error) {
    redirect(`${redirectTo}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/today");
  revalidatePath("/history");
  revalidatePath(`/visits/${visitId}`);
  redirect(`${redirectTo}?ok=updated`);
}

export async function cancelVisitAction(formData: FormData) {
  const redirectTo = String(formData.get("redirect_to") ?? "/history?tab=active");
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const visitId = String(formData.get("visit_id") ?? "");
  if (!visitId) {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=Solicitud%20inválida`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: visit } = await supabase
    .from("visits")
    .select("id,resident_id,status")
    .eq("id", visitId)
    .single();

  if (!visit || visit.resident_id !== session.user.id || visit.status !== "pending") {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=No%20se%20puede%20cancelar%20esta%20visita`);
  }

  const { error } = await supabase
    .from("visits")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString()
    })
    .eq("id", visitId);

  if (error) {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/history");
  revalidatePath(`/visits/${visitId}`);
  redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}ok=cancelled`);
}
