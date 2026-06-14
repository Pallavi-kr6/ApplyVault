import { descriptionFromSelectors, JobExtractor, text } from "./types";

export const leverExtractor: JobExtractor = {
  platform: "Lever",
  matches: (url) => url.hostname === "jobs.lever.co",
  extractJobData: () => ({
    companyName: window.location.pathname.split("/").filter(Boolean)[0] ?? "Unknown company",
    jobTitle: text(".posting-headline h2") || text("h2") || document.title,
    location: text(".location") || null,
    salary: text(".salary-range") || null,
    employmentType: text(".commitment") || null,
    jobDescription: descriptionFromSelectors([".section-wrapper", ".posting-page", ".content"]),
    applicationUrl: window.location.href,
    sourcePlatform: "Lever",
    rawHtml: document.documentElement.outerHTML
  })
};
