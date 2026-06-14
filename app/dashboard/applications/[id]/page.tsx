import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ApplicationDetail } from "@/lib/types/application";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

function ListBlock({ title, items }: { title: string; items: string[] | undefined }) {
  return (
    <Card>
      <CardHeader>
        <h2 className="font-semibold">{title}</h2>
      </CardHeader>
      <CardContent>
        {items?.length ? (
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">No data extracted yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("applications")
    .select("*, ai_analysis(*), job_snapshots(raw_html, raw_job_description)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!data) notFound();
  const application = data as ApplicationDetail;

  return (
    <DashboardShell>
      <div className="space-y-6 p-5 md:p-8">
        <Link className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground" href="/dashboard">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <header className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-semibold">{application.job_title}</h1>
            <p className="mt-2 text-lg text-muted-foreground">{application.company_name}</p>
          </div>
          <Badge>{application.status}</Badge>
        </header>
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card><CardContent><p className="text-sm text-muted-foreground">Salary</p><p className="mt-2 font-medium">{application.salary ?? "-"}</p></CardContent></Card>
          <Card><CardContent><p className="text-sm text-muted-foreground">Location</p><p className="mt-2 font-medium">{application.location ?? "-"}</p></CardContent></Card>
          <Card><CardContent><p className="text-sm text-muted-foreground">Applied</p><p className="mt-2 font-medium">{formatDate(application.applied_at)}</p></CardContent></Card>
          <Card><CardContent><p className="text-sm text-muted-foreground">Source</p><p className="mt-2 font-medium">{application.source_platform}</p></CardContent></Card>
        </section>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">AI Summary</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-6 text-muted-foreground">{application.ai_analysis?.summary ?? "Analysis is pending or unavailable."}</p>
            {application.ai_analysis?.ai_match_score != null && (
              <p className="text-sm font-medium">Resume match score: {application.ai_analysis.ai_match_score}%</p>
            )}
            <a className="inline-flex items-center gap-2 text-sm text-primary hover:underline" href={application.application_url} target="_blank" rel="noreferrer">
              Original URL <ExternalLink className="h-4 w-4" />
            </a>
          </CardContent>
        </Card>
        <section className="grid gap-4 lg:grid-cols-2">
          <ListBlock title="Required Skills" items={application.ai_analysis?.required_skills} />
          <ListBlock title="Preferred Skills" items={application.ai_analysis?.preferred_skills} />
          <ListBlock title="Responsibilities" items={application.ai_analysis?.responsibilities} />
          <ListBlock title="Qualifications" items={application.ai_analysis?.qualifications} />
        </section>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Full Job Description</h2>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
              {application.job_snapshots?.raw_job_description ?? "No job description snapshot was saved."}
            </pre>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-semibold">Application Timeline</h2>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-muted-foreground">
              <li>Saved from {application.source_platform} on {formatDate(application.created_at)}</li>
              <li>Status is currently {application.status}</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
