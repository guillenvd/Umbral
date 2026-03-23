"use client";

export default function ProtectedError({ reset }: { reset: () => void }) {
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 shadow-card">
      <h1 className="text-lg font-semibold">Ocurrió un error</h1>
      <p className="text-sm text-slate-600">No pudimos cargar esta vista. Intenta nuevamente.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand px-4 py-2 text-sm font-medium text-white"
      >
        Reintentar
      </button>
    </section>
  );
}
