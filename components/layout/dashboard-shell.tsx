import Link from "next/link";
import { BriefcaseBusiness, KanbanSquare, Upload } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function DashboardShell({ children }: { children: React.ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card p-5 md:block">
        <h1 className="text-xl font-semibold">ResumeTracker AI</h1>
        <p className="mt-1 truncate text-sm text-muted-foreground">{user?.email}</p>
        <nav className="mt-8 space-y-1">
          <Link className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted" href="/dashboard">
            <BriefcaseBusiness className="h-4 w-4" /> Applications
          </Link>
          <Link className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted" href="/dashboard/board">
            <KanbanSquare className="h-4 w-4" /> Board
          </Link>
          <a className="flex items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted" href="#resume-upload">
            <Upload className="h-4 w-4" /> Resume
          </a>
        </nav>
      </aside>
      <main className="md:pl-64">{children}</main>
    </div>
  );
}
