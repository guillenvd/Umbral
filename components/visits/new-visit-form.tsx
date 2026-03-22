"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type NewVisitFormProps = {
  action: (formData: FormData) => Promise<void>;
};

export function NewVisitForm({ action }: NewVisitFormProps) {
  const [type, setType] = useState<"visitor" | "delivery">("visitor");

  return (
    <form action={action} className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
      <label className="block text-sm">
        <span className="mb-1 block">Tipo</span>
        <select
          value={type}
          name="type"
          onChange={(event) => setType(event.target.value as "visitor" | "delivery")}
          className="w-full rounded-xl border border-slate-300 px-3 py-3"
        >
          <option value="visitor">Visita</option>
          <option value="delivery">Repartidor</option>
        </select>
      </label>

      <label className="block text-sm">
        <span className="mb-1 block">{type === "delivery" ? "Nombre repartidor (opcional)" : "Nombre visitante"}</span>
        <input
          name="visitor_name"
          required={type === "visitor"}
          className="w-full rounded-xl border border-slate-300 px-3 py-3"
          placeholder="Nombre completo"
        />
      </label>

      <label className="block text-sm">
        <span className="mb-1 block">Hora estimada</span>
        <input name="eta_at" type="datetime-local" required className="w-full rounded-xl border border-slate-300 px-3 py-3" />
      </label>

      {type === "visitor" && (
        <label className="block text-sm">
          <span className="mb-1 block">Notas (opcional)</span>
          <textarea name="note" className="w-full rounded-xl border border-slate-300 px-3 py-3" rows={3} />
        </label>
      )}

      {type === "delivery" && (
        <>
          <label className="block text-sm">
            <span className="mb-1 block">Empresa (opcional)</span>
            <input name="delivery_company" className="w-full rounded-xl border border-slate-300 px-3 py-3" placeholder="Rappi, Amazon..." />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Tipo de entrega</span>
            <input name="delivery_type" required className="w-full rounded-xl border border-slate-300 px-3 py-3" placeholder="Comida, paquete, etc." />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Instrucciones</span>
            <textarea
              name="instructions"
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-3"
              rows={3}
              placeholder="Referencias para caseta o casa"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block">Ubicación de entrega</span>
            <select name="dropoff_location" required className="w-full rounded-xl border border-slate-300 px-3 py-3" defaultValue="gate">
              <option value="gate">Caseta</option>
              <option value="house">Casa</option>
            </select>
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-3 text-sm">
            <input name="contactless" type="checkbox" className="h-4 w-4 rounded border-slate-400" />
            <span>Entrega sin contacto</span>
          </label>
        </>
      )}

      <Button type="submit" className="w-full">
        Crear {type === "delivery" ? "repartidor" : "visita"}
      </Button>
    </form>
  );
}
