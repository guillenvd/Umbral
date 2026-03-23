import Link from "next/link";
import { redirect } from "next/navigation";
import { NewAnnouncementForm } from "@/components/announcements/new-announcement-form";
import { getCurrentUserRole } from "@/lib/auth/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function NewAnnouncementPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const role = await getCurrentUserRole();
  if (!(role === "committee" || role === "admin")) {
    redirect("/unauthorized");
  }

  const params = (await searchParams) ?? {};
  const error = typeof params.error === "string" ? decodeURIComponent(params.error) : undefined;
  const ok = typeof params.ok === "string" ? params.ok : undefined;

  return (
    <section className="space-y-3 pb-20">
      <header className="space-y-2">
        <h1 className="text-xl font-semibold">Nuevo comunicado</h1>
        <Link
          href="/announcements"
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900"
        >
          Volver a comunicados
        </Link>
      </header>
      <NewAnnouncementForm error={error} ok={ok} />
    </section>
  );
}
