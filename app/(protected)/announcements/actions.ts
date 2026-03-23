"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSession, getCurrentUserRole } from "@/lib/auth/session";
import { logServerError } from "@/lib/logger";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_PRIORITIES = ["normal", "important", "urgent"] as const;
type AnnouncementPriority = (typeof VALID_PRIORITIES)[number];

function isAnnouncementPriority(value: string): value is AnnouncementPriority {
  return VALID_PRIORITIES.includes(value as AnnouncementPriority);
}

export async function createAnnouncementAction(formData: FormData) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login");
  }

  const role = await getCurrentUserRole();
  if (!(role === "committee" || role === "admin")) {
    redirect("/unauthorized");
  }

  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "normal");

  if (!title || title.length > 120) {
    redirect("/announcements/new?error=Título%20inválido");
  }

  if (!body) {
    redirect("/announcements/new?error=El%20contenido%20es%20obligatorio");
  }

  if (!isAnnouncementPriority(priorityRaw)) {
    redirect("/announcements/new?error=Prioridad%20inválida");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("announcements").insert({
    created_by: session.user.id,
    title,
    body,
    priority: priorityRaw,
    is_published: true,
    published_at: new Date().toISOString()
  });

  if (error) {
    logServerError("createAnnouncementAction.insert", error, { createdBy: session.user.id, priority: priorityRaw });
    redirect(`/announcements/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/announcements");
  redirect("/announcements?ok=created");
}
