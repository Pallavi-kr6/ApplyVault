import { redirect } from "next/navigation";
import { ApplicationTable } from "@/components/dashboard/application-table";
import { ResumeUpload } from "@/components/dashboard/resume-upload";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Application } from "@/lib/types/application";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
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

  const items = applications as Application[];
  const stats = [
    ["Total Applications", items.length],
    ["Interviews", items.filter((item) => item.status === "Interview").length],
    ["Rejections", items.filter((item) => item.status === "Rejected").length],
    ["Offers", items.filter((item) => item.status === "Offer").length]
  ];

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-normal">Applications</h1>
          <p className="mt-2 text-sm text-muted-foreground">Track saved job applications and AI-extracted insights.</p>
        </header>
        <section className="grid gap-4 md:grid-cols-4">
          {stats.map(([label, value]) => (
            <Card key={label}>
              <CardContent>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-3xl font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>
        <ApplicationTable applications={items} />
        <ResumeUpload />
      </div>
    </DashboardShell>
  );
}
