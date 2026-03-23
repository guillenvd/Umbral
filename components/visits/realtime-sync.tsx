"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RealtimeVisitsSyncProps = {
  visitId?: string;
  channelName?: string;
};

export function RealtimeVisitsSync({ visitId, channelName = "visits" }: RealtimeVisitsSyncProps) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`${channelName}-sync-${visitId ?? "all"}`);

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "visits",
        ...(visitId ? { filter: `id=eq.${visitId}` } : {})
      },
      () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          startTransition(() => router.refresh());
        }, 220);
      }
    );

    channel.subscribe();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      supabase.removeChannel(channel);
    };
  }, [channelName, router, startTransition, visitId]);

  return (
    <p className="text-xs text-slate-500" aria-live="polite">
      {pending ? "Actualizando en vivo…" : "En vivo"}
    </p>
  );
}
