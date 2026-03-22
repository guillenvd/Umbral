import { createVisitAction } from "@/app/(protected)/visits/actions";
import { NewVisitForm } from "@/components/visits/new-visit-form";

type NewVisitPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewVisitPage({ searchParams }: NewVisitPageProps) {
  const params = await searchParams;

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Nuevo acceso</h1>
      {params.error ? <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{params.error}</p> : null}
      <NewVisitForm action={createVisitAction} />
    </section>
  );
}
