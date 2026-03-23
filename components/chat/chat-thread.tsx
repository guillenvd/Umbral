"use client";

import { useEffect, useRef } from "react";

type ChatMessage = {
  id: string;
  from_user: string;
  content: string;
  created_at: string;
};

export function ChatThread({ messages, currentUserId }: { messages: ChatMessage[]; currentUserId: string }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="flex-1 space-y-2 overflow-y-auto px-1">
      {messages.map((message) => {
        const mine = message.from_user === currentUserId;
        return (
          <article key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-white text-slate-800 shadow-card"}`}>
              <p>{message.content}</p>
              <p className={`mt-1 text-[10px] ${mine ? "text-white/80" : "text-slate-500"}`}>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
          </article>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
