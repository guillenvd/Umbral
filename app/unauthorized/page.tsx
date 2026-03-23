import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="min-h-dvh px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-card">
        <h1 className="text-lg font-semibold">Sin permisos</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tu rol actual no tiene acceso a esta ruta.
        </p>
        <Link
          href="/today"
          className="mt-4 inline-flex rounded-xl bg-brand px-4 py-2 text-sm font-medium text-brand-foreground"
        >
          Volver a inicio
        </Link>
      </div>
    </main>
  );
}
