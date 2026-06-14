export const applicationStatuses = ["Applied", "Assessment", "Interview", "Offer", "Rejected"] as const;

export type ApplicationStatus = (typeof applicationStatuses)[number];

export type JobData = {
  companyName: string;
  jobTitle: string;
  location: string | null;
  salary: string | null;
  employmentType: string | null;
  jobDescription: string;
  applicationUrl: string;
  sourcePlatform: string;
};

export type Application = {
  id: string;
  user_id: string;
  company_name: string;
  job_title: string;
  application_url: string;
  location: string | null;
  employment_type: string | null;
  salary: string | null;
  status: ApplicationStatus;
  applied_at: string;
  source_platform: string;
  created_at: string;
};

export type AIAnalysis = {
  id: string;
  application_id: string;
  summary: string | null;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  qualifications: string[];
  experience_required: string | null;
  ai_match_score: number | null;
  missing_skills?: string[];
  strength_areas?: string[];
};

export type ApplicationDetail = Application & {
  ai_analysis: AIAnalysis | null;
  job_snapshots: {
    raw_html: string | null;
    raw_job_description: string | null;
  } | null;
};
