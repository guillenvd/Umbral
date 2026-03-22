import { createVisitAction } from "@/app/(protected)/visits/actions";
import { NewVisitForm } from "@/components/visits/new-visit-form";

export default function NewVisitPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-xl font-semibold">Nuevo acceso</h1>
      <NewVisitForm action={createVisitAction} />
    </section>
  );
}
