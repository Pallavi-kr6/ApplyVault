import { NextResponse } from "next/server";
import { z } from "zod";
import { analyzeJobDescription, scoreResumeMatch } from "@/lib/ai/groq";
import { getLatestResumeText } from "@/lib/resume/latest-resume";
import { createSupabaseServerClient, createSupabaseServiceClient, getUserFromRequest } from "@/lib/supabase/server";

const createApplicationSchema = z.object({
  companyName: z.string().min(1),
  jobTitle: z.string().min(1),
  applicationUrl: z.string().url(),
  location: z.string().nullable().optional(),
  employmentType: z.string().nullable().optional(),
  salary: z.string().nullable().optional(),
  jobDescription: z.string().min(1),
  rawHtml: z.string().nullable().optional(),
  sourcePlatform: z.string().min(1)
});

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const search = url.searchParams.get("search");
  const status = url.searchParams.get("status");

  let query = supabase
    .from("applications")
    .select("*")
    .eq("user_id", user.id)
    .order("applied_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (search) query = query.or(`company_name.ilike.%${search}%,job_title.ilike.%${search}%`);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ applications: data });
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = createApplicationSchema.parse(await request.json());
  const service = createSupabaseServiceClient();

  const { data: application, error } = await service
    .from("applications")
    .insert({
      user_id: user.id,
      company_name: body.companyName,
      job_title: body.jobTitle,
      application_url: body.applicationUrl,
      location: body.location,
      employment_type: body.employmentType,
      salary: body.salary,
      source_platform: body.sourcePlatform
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await service.from("job_snapshots").insert({
    application_id: application.id,
    raw_html: body.rawHtml,
    raw_job_description: body.jobDescription
  });

  try {
    const analysis = await analyzeJobDescription(body.jobDescription);
    const latestResumeText = await getLatestResumeText(service, user.id);
    const match = latestResumeText
      ? scoreResumeMatch(latestResumeText, body.jobDescription, analysis)
      : null;

    await service.from("ai_analysis").insert({
      application_id: application.id,
      summary: analysis.summary,
      required_skills: analysis.requiredSkills,
      preferred_skills: analysis.preferredSkills,
      responsibilities: analysis.responsibilities,
      qualifications: analysis.qualifications,
      experience_required: analysis.experienceLevel,
      ai_match_score: match?.score ?? null,
      missing_skills: match?.missingSkills ?? [],
      strength_areas: match?.strengthAreas ?? []
    });
  } catch (analysisError) {
    console.error(analysisError);
  }

  return NextResponse.json({ application }, { status: 201 });
}
