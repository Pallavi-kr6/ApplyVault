import { redirect } from "next/navigation";
import { KanbanBoard } from "@/components/dashboard/kanban-board";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Application } from "@/lib/types/application";

export const dynamic = "force-dynamic";

export default async function BoardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: applications = [] } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <header>
          <h1 className="text-3xl font-semibold">Kanban Board</h1>
          <p className="mt-2 text-sm text-muted-foreground">Move applications through the hiring pipeline.</p>
        </header>
        <KanbanBoard applications={applications as Application[]} />
      </div>
    </DashboardShell>
  );
}
