import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

async function signIn(formData: FormData) {
  "use server";

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/today");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(nextPath);
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-dvh px-4 py-8">
      <section className="rounded-2xl bg-white p-6 shadow-card">
        <h1 className="text-xl font-semibold">Entrar a Umbral</h1>
        <p className="mt-1 text-sm text-slate-600">Acceso para residentes, caseta y administración.</p>

        <form action={signIn} className="mt-6 space-y-3">
          <input type="hidden" name="next" value={params.next ?? "/today"} />
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">Email</span>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-3"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-700">Contraseña</span>
            <input
              name="password"
              type="password"
              required
              className="w-full rounded-xl border border-slate-300 px-3 py-3"
            />
          </label>
          {params.error ? <p className="text-sm text-rose-600">{params.error}</p> : null}
          <Button type="submit" className="w-full">
            Iniciar sesión
          </Button>
        </form>
      </section>
    </main>
  );
}
