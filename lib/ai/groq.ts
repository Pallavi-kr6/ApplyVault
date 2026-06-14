import { z } from "zod";

export const aiAnalysisSchema = z.object({
  role: z.string().optional(),
  company: z.string().optional(),
  salary: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  summary: z.string().default(""),
  responsibilities: z.array(z.string()).default([]),
  requiredSkills: z.array(z.string()).default([]),
  preferredSkills: z.array(z.string()).default([]),
  qualifications: z.array(z.string()).default([]),
  experienceLevel: z.string().nullable().optional()
});

export type GroqAnalysis = z.infer<typeof aiAnalysisSchema>;

export async function analyzeJobDescription(jobDescription: string) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const prompt = `Extract role, company, salary, location, responsibilities, required skills, preferred skills, qualifications, and experience level from this job description. Return valid JSON only with keys: role, company, salary, location, summary, responsibilities, requiredSkills, preferredSkills, qualifications, experienceLevel.\n\nJob description:\n${jobDescription}`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You extract job metadata. Return strict JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq request failed: ${error}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Groq returned an empty analysis.");
  }
  console.log("CONTENT:", content);
  return aiAnalysisSchema.parse(JSON.parse(content));
}

export function scoreResumeMatch(resumeText: string, jobDescription: string, analysis: GroqAnalysis) {
  const resume = resumeText.toLowerCase();
  const required = analysis.requiredSkills ?? [];
  const preferred = analysis.preferredSkills ?? [];
  const allSkills = [...required, ...preferred];
  const matched = allSkills.filter((skill) => resume.includes(skill.toLowerCase()));
  const missing = required.filter((skill) => !resume.includes(skill.toLowerCase()));
  const score = allSkills.length ? Math.round((matched.length / allSkills.length) * 100) : null;

  const strengthAreas = matched.slice(0, 12);
  if (!strengthAreas.length && jobDescription) {
    strengthAreas.push("Relevant background should be reviewed against the full job description.");
  }

  return {
    score,
    missingSkills: missing,
    strengthAreas
  };
}
