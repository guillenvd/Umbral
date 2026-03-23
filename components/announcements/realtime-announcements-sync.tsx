"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function RealtimeAnnouncementsSync() {
  const router = useRouter();
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase.channel("announcements-sync");

    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "announcements"
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
  }, [router, startTransition]);

  return <p className="text-xs text-slate-500">{pending ? "Actualizando comunicados..." : "Comunicados en vivo"}</p>;
}
