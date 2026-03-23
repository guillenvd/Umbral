"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";
import { cn } from "@/lib/utils";
import type { AppRole } from "@/lib/auth/roles";

const navByRole: Record<AppRole, Array<{ href: Route; label: string }>> = {
  resident: [
    { href: "/visits/new", label: "Nueva" },
    { href: "/messages", label: "Mensajes" },
    { href: "/history", label: "Historial" },
    { href: "/announcements", label: "Avisos" }
  ],
  guard: [
    { href: "/today", label: "Hoy" },
    { href: "/messages", label: "Mensajes" },
    { href: "/history", label: "Historial" },
    { href: "/announcements", label: "Avisos" }
  ],
  committee: [
    { href: "/announcements", label: "Avisos" },
    { href: "/history", label: "Historial" }
  ],
  admin: [
    { href: "/today", label: "Hoy" },
    { href: "/visits/new", label: "Nueva" },
    { href: "/announcements", label: "Avisos" }
  ]
};

export function BottomNav({ role, unreadMessages = 0 }: { role: AppRole; unreadMessages?: number }) {
  const pathname = usePathname();
  const items = navByRole[role];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md border-t border-slate-200 bg-white px-2 pb-safe pt-2">
      <ul className="grid grid-cols-4 gap-1">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "flex min-h-12 items-center justify-center rounded-xl text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
                  isActive ? "bg-teal-50 text-brand" : "text-slate-600"
                )}
              >
                <span className="relative">
                  {item.label}
                  {item.href === "/messages" && unreadMessages > 0 ? (
                    <span className="absolute -right-4 -top-2 rounded-full bg-rose-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                      {unreadMessages > 99 ? "99+" : unreadMessages}
                    </span>
                  ) : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
