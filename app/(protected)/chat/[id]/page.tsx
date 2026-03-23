import Link from "next/link";
import { notFound } from "next/navigation";
import { sendMessageAction } from "@/app/(protected)/chat/actions";
import { RealtimeChatSync } from "@/components/chat/realtime-chat-sync";
import { ChatThread } from "@/components/chat/chat-thread";
import { ActionSubmit } from "@/components/visits/action-submit";
import { getCurrentSession, getCurrentUserRole } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPrimaryGuardUserId } from "@/lib/chat";

type ChatPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ visit_id?: string; ok?: string; error?: string }>;
};

export default async function ChatPage({ params, searchParams }: ChatPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const session = await getCurrentSession();
  const role = await getCurrentUserRole();
  const supabase = await createSupabaseServerClient();

  if (!session?.user) return null;

  const { data: peer } = await supabase.from("profiles").select("id,full_name,role").eq("id", id).maybeSingle();
  if (!peer) notFound();

  if (role === "resident" && peer.role !== "guard") notFound();
  if (role === "guard" && peer.role !== "resident") notFound();
  if (!(role === "resident" || role === "guard")) notFound();

  const guardId = role === "resident" ? await getPrimaryGuardUserId() : null;
  if (role === "resident" && guardId && guardId !== peer.id) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("id,from_user,to_user,visit_id,content,created_at")
    .or(`and(from_user.eq.${session.user.id},to_user.eq.${peer.id}),and(from_user.eq.${peer.id},to_user.eq.${session.user.id})`)
    .order("created_at", { ascending: true })
    .limit(300);

  await supabase.from("conversation_reads").upsert(
    {
      user_id: session.user.id,
      peer_id: peer.id,
      last_read_at: new Date().toISOString()
    },
    { onConflict: "user_id,peer_id" }
  );

  const visitId = query.visit_id?.trim() || "";

  return (
    <section className="flex min-h-[70dvh] flex-col gap-3 pb-24">
      <header className="rounded-2xl bg-white p-3 shadow-card">
        <Link href="/messages" className="text-xs text-brand">← Volver</Link>
        <h1 className="text-lg font-semibold">{peer.full_name}</h1>
        <RealtimeChatSync channelName="messages-chat" peerId={peer.id} />
      </header>

      {query.ok ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Mensaje enviado.</p> : null}
      {query.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{query.error}</p> : null}

      <ChatThread messages={messages ?? []} currentUserId={session.user.id} />

      <form action={sendMessageAction} className="sticky bottom-16 mt-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-card">
        <input type="hidden" name="to_user" value={peer.id} />
        <input type="hidden" name="visit_id" value={visitId} />
        <input type="hidden" name="redirect_to" value={`/chat/${peer.id}${visitId ? `?visit_id=${visitId}` : ""}`} />
        <div className="flex items-end gap-2">
          <textarea
            name="content"
            required
            rows={2}
            className="min-h-11 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="Escribe un mensaje..."
          />
          <ActionSubmit className="rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white disabled:opacity-70">
            Enviar
          </ActionSubmit>
        </div>
      </form>
    </section>
  );
}
