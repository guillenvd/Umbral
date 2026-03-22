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
  if (!(role === "resident" || role === "admin")) {
    redirect("/unauthorized");
  }

  const typeRaw = String(formData.get("type") ?? "visitor");
  if (!isVisitType(typeRaw)) {
    throw new Error("Tipo de visita inválido.");
  }

  const type = typeRaw;
  const etaRaw = String(formData.get("eta_at") ?? "");
  const etaDate = new Date(etaRaw);
  if (!etaRaw || Number.isNaN(etaDate.getTime())) {
    throw new Error("Hora estimada inválida.");
  }

  const visitorName = String(formData.get("visitor_name") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const deliveryCompany = String(formData.get("delivery_company") ?? "").trim();
  const deliveryType = String(formData.get("delivery_type") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const dropoffLocationRaw = String(formData.get("dropoff_location") ?? "").trim();
  const contactless = formData.get("contactless") === "on";

  if (type === "visitor" && !visitorName) {
    throw new Error("El nombre del visitante es obligatorio.");
  }
  if (type === "delivery" && !dropoffLocationRaw) {
    throw new Error("La ubicación de entrega es obligatoria para delivery.");
  }
  if (type === "delivery" && !["gate", "house"].includes(dropoffLocationRaw)) {
    throw new Error("Ubicación de entrega inválida.");
  }
  if (type === "delivery" && !deliveryType) {
    throw new Error("El tipo de entrega es obligatorio.");
  }
  if (type === "delivery" && !instructions) {
    throw new Error("Las instrucciones son obligatorias.");
  }

  const houseId = await getCurrentHouseId(session.user.id);
  if (!houseId) {
    throw new Error("No se encontró vivienda activa para este usuario.");
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
    throw new Error(error.message);
  }

  revalidatePath("/history");
  revalidatePath("/today");
  redirect("/history?tab=active");
}

export async function updateVisitStatusAction(formData: FormData) {
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
    throw new Error("Solicitud inválida.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: visit, error: visitError } = await supabase
    .from("visits")
    .select("id,status,type")
    .eq("id", visitId)
    .single();

  if (visitError || !visit || !isVisitStatus(visit.status) || !isVisitType(visit.type)) {
    throw new Error("Visita no encontrada.");
  }

  if (!canTransition(visit.status, statusRaw, visit.type)) {
    throw new Error("Transición de estado inválida.");
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
    throw new Error(error.message);
  }

  revalidatePath("/today");
  revalidatePath("/history");
  revalidatePath(`/visits/${visitId}`);
}

export async function cancelVisitAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const visitId = String(formData.get("visit_id") ?? "");
  if (!visitId) {
    throw new Error("Solicitud inválida.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: visit } = await supabase
    .from("visits")
    .select("id,resident_id,status")
    .eq("id", visitId)
    .single();

  if (!visit || visit.resident_id !== session.user.id || visit.status !== "pending") {
    throw new Error("No se puede cancelar esta visita.");
  }

  const { error } = await supabase
    .from("visits")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString()
    })
    .eq("id", visitId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/history");
  revalidatePath(`/visits/${visitId}`);
}
