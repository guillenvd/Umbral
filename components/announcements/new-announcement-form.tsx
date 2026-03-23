"use client";

import { useMemo } from "react";
import { createAnnouncementAction } from "@/app/(protected)/announcements/actions";
import { Button } from "@/components/ui/button";

type NewAnnouncementFormProps = {
  error?: string;
  ok?: string;
};

export function NewAnnouncementForm({ error, ok }: NewAnnouncementFormProps) {
  const hasSuccess = useMemo(() => ok === "created", [ok]);

  return (
    <form action={createAnnouncementAction} className="space-y-4 rounded-2xl bg-white p-4 shadow-card">
      {error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
      {hasSuccess ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Comunicado publicado.</p>
      ) : null}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Título</span>
        <input
          name="title"
          required
          maxLength={120}
          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none ring-blue-300 focus:ring"
          placeholder="Ej. Corte de agua programado"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Contenido</span>
        <textarea
          name="body"
          required
          rows={5}
          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none ring-blue-300 focus:ring"
          placeholder="Detalle del comunicado..."
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Prioridad</span>
        <select
          name="priority"
          defaultValue="normal"
          className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none ring-blue-300 focus:ring"
        >
          <option value="normal">Normal</option>
          <option value="important">Importante</option>
          <option value="urgent">Urgente</option>
        </select>
      </label>

      <Button type="submit" className="w-full">Publicar comunicado</Button>
    </form>
  );
}
