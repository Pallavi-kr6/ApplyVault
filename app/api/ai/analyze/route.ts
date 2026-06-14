import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJobDescription, scoreResumeMatch } from "@/lib/ai/groq";
import { getLatestResumeText } from "@/lib/resume/latest-resume";
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";

const bodySchema = z.object({
  applicationId: z.string().uuid(),
  resumeText: z.string().optional()
});

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = bodySchema.parse(await request.json());
  const { data: application, error } = await supabase
    .from("applications")
    .select("id, user_id, job_snapshots(raw_job_description)")
    .eq("id", body.applicationId)
    .eq("user_id", user.id)
    .single();

  const snapshot = Array.isArray(application?.job_snapshots)
    ? application.job_snapshots[0]
    : application?.job_snapshots;

  if (error || !snapshot?.raw_job_description) {
    return NextResponse.json({ error: "Application job description was not found." }, { status: 404 });
  }

  const jobDescription = snapshot.raw_job_description;
  const analysis = await analyzeJobDescription(jobDescription);
  const service = createSupabaseServiceClient();
  const resumeText = body.resumeText ?? await getLatestResumeText(service, user.id);
  const match = resumeText ? scoreResumeMatch(resumeText, jobDescription, analysis) : null;

  const { data, error: upsertError } = await service
    .from("ai_analysis")
    .upsert({
      application_id: body.applicationId,
      summary: analysis.summary,
      required_skills: analysis.requiredSkills,
      preferred_skills: analysis.preferredSkills,
      responsibilities: analysis.responsibilities,
      qualifications: analysis.qualifications,
      experience_required: analysis.experienceLevel,
      ai_match_score: match?.score ?? null,
      missing_skills: match?.missingSkills ?? [],
      strength_areas: match?.strengthAreas ?? []
    }, { onConflict: "application_id" })
    .select("*")
    .single();

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  return NextResponse.json({ analysis: data });
}
