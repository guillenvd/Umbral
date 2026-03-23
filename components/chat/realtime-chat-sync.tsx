"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RealtimeChatSyncProps = {
  channelName: string;
  peerId?: string;
};

export function RealtimeChatSync({ channelName, peerId }: RealtimeChatSyncProps) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`${channelName}-${peerId ?? "all"}`);
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "messages"
      },
      () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          startTransition(() => router.refresh());
        }, 180);
      }
    );

    channel.subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [channelName, peerId, router, startTransition]);

  return <p className="text-xs text-slate-500">{pending ? "Actualizando mensajes..." : "Mensajería en vivo"}</p>;
}
