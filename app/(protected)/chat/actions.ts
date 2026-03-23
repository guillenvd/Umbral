"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession, getCurrentUserRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function sendMessageAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();
  if (!(role === "resident" || role === "guard")) {
    redirect("/unauthorized");
  }

  const toUser = String(formData.get("to_user") ?? "");
  const visitIdRaw = String(formData.get("visit_id") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const redirectTo = String(formData.get("redirect_to") ?? "/messages");

  if (!toUser || !content) {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=Mensaje%20inválido`);
  }

  const supabase = await createSupabaseServerClient();
  const { data: recipient } = await supabase.from("profiles").select("id,role").eq("id", toUser).maybeSingle();
  if (!recipient) {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=Destino%20inválido`);
  }

  if (role === "resident" && recipient.role !== "guard") {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=Solo%20puedes%20escribir%20a%20caseta`);
  }
  if (role === "guard" && recipient.role !== "resident") {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=Caseta%20solo%20puede%20responder%20a%20residentes`);
  }

  const visitId = visitIdRaw || null;
  if (visitId) {
    const { data: visit } = await supabase.from("visits").select("id,resident_id").eq("id", visitId).maybeSingle();
    if (!visit) {
      redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=Visita%20inválida`);
    }

    if (role === "resident" && visit.resident_id !== session.user.id) {
      redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=No%20puedes%20usar%20esa%20visita`);
    }
  }

  const { error } = await supabase.from("messages").insert({
    from_user: session.user.id,
    to_user: toUser,
    visit_id: visitId,
    content
  });

  if (error) {
    redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/messages");
  revalidatePath(redirectTo.split("?")[0] || "/messages");
  redirect(`${redirectTo}${redirectTo.includes("?") ? "&" : "?"}ok=sent`);
}
