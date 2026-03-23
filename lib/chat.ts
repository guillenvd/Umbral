import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getPrimaryGuardUserId() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "guard")
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  return data?.id ?? null;
}

type MessageRow = {
  from_user: string;
  to_user: string;
  created_at: string;
};

type ReadRow = {
  peer_id: string;
  last_read_at: string;
};

export function buildUnreadMap(
  currentUserId: string,
  messages: MessageRow[],
  reads: ReadRow[]
) {
  const readMap = new Map(reads.map((row) => [row.peer_id, row.last_read_at]));
  const unreadByPeer = new Map<string, number>();

  messages.forEach((message) => {
    if (message.to_user !== currentUserId) return;
    const peerId = message.from_user;
    const lastRead = readMap.get(peerId);
    if (!lastRead || new Date(message.created_at).getTime() > new Date(lastRead).getTime()) {
      unreadByPeer.set(peerId, (unreadByPeer.get(peerId) ?? 0) + 1);
    }
  });

  return unreadByPeer;
}
