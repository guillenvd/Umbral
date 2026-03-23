import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentSession, getCurrentUserRole } from "@/lib/auth/session";
import { RealtimeChatSync } from "@/components/chat/realtime-chat-sync";
import { buildUnreadMap } from "@/lib/chat";

type MessagesPageProps = {
  searchParams: Promise<{ ok?: string; error?: string }>;
};

type MessageRow = {
  id: string;
  from_user: string;
  to_user: string;
  content: string;
  created_at: string;
};

export default async function MessagesPage({ searchParams }: MessagesPageProps) {
  const params = await searchParams;
  const session = await getCurrentSession();
  const role = await getCurrentUserRole();
  const supabase = await createSupabaseServerClient();

  if (!session?.user) return null;

  const { data: messageRows } = await supabase
    .from("messages")
    .select("id,from_user,to_user,content,created_at")
    .or(`from_user.eq.${session.user.id},to_user.eq.${session.user.id}`)
    .order("created_at", { ascending: false })
    .limit(200);
  const { data: readRows } = await supabase
    .from("conversation_reads")
    .select("peer_id,last_read_at")
    .eq("user_id", session.user.id);

  const peerIds = new Set<string>();
  (messageRows ?? []).forEach((message) => {
    peerIds.add(message.from_user);
    peerIds.add(message.to_user);
  });
  peerIds.delete(session.user.id);

  const ids = Array.from(peerIds);
  const { data: peers } = ids.length
    ? await supabase.from("profiles").select("id,full_name,role").in("id", ids)
    : { data: [] as Array<{ id: string; full_name: string; role: string }> };

  const peersMap = new Map((peers ?? []).map((peer) => [peer.id, peer]));
  const conversations = new Map<string, MessageRow>();
  const unreadMap = buildUnreadMap(session.user.id, (messageRows ?? []) as MessageRow[], readRows ?? []);

  (messageRows ?? []).forEach((message) => {
    const peerId = message.from_user === session.user.id ? message.to_user : message.from_user;
    if (!conversations.has(peerId)) {
      conversations.set(peerId, message);
    }
  });

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Mensajes</h1>
      <RealtimeChatSync channelName="messages-inbox" />
      {params.ok ? <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Mensaje enviado.</p> : null}
      {params.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p> : null}

      <div className="space-y-3">
        {Array.from(conversations.entries()).map(([peerId, message]) => {
          const peer = peersMap.get(peerId);
          if (!peer) return null;
          if (role === "resident" && peer.role !== "guard") return null;
          if (role === "guard" && peer.role !== "resident") return null;

          return (
            <Link key={peerId} href={`/chat/${peerId}`} className="block rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{peer.full_name}</p>
                  {(unreadMap.get(peerId) ?? 0) > 0 ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
                      {unreadMap.get(peerId)}
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500">{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{message.content}</p>
            </Link>
          );
        })}

        {conversations.size === 0 ? (
          <article className="rounded-2xl bg-white p-4 text-sm text-slate-600 shadow-card">Aún no hay conversaciones.</article>
        ) : null}
      </div>
    </section>
  );
}
