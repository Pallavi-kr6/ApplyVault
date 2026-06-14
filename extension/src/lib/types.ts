export type ExtractedJobData = {
  companyName: string;
  jobTitle: string;
  location: string | null;
  salary: string | null;
  employmentType: string | null;
  jobDescription: string;
  applicationUrl: string;
  sourcePlatform: string;
  rawHtml: string;
};

export type ExtensionSettings = {
  apiBaseUrl?: string;
  accessToken?: string;
};
