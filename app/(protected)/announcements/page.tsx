import { Button } from "@/components/ui/button";

export default function AnnouncementsPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-xl font-semibold">Comunicados</h1>
      <article className="rounded-2xl bg-white p-4 shadow-card">
        <p className="text-sm font-medium">Listado de avisos</p>
        <p className="mt-1 text-sm text-slate-600">Placeholder para feed broadcast.</p>
      </article>
      <Button type="button" className="w-full">
        Crear comunicado (placeholder)
      </Button>
    </section>
  );
}
