"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type RealtimeVisitsSyncProps = {
  visitId?: string;
};

export function RealtimeVisitsSync({ visitId }: RealtimeVisitsSyncProps) {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel(`visits-sync-${visitId ?? "all"}`);

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
  }, [router, startTransition, visitId]);

  return null;
}
