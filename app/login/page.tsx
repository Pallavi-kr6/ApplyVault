import { redirect } from "next/navigation";
import { LoginForm } from "@/components/dashboard/login-form";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const canCheckSession = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (canCheckSession) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (user) redirect("/dashboard");
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4">
      <section className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">ResumeTracker AI</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to track applications automatically.</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
