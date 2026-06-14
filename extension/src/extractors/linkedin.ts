import { descriptionFromSelectors, JobExtractor, text } from "./types";

export const linkedinExtractor: JobExtractor = {
  platform: "LinkedIn",
  matches: (url) => url.hostname.includes("linkedin.com") && url.pathname.includes("/jobs"),
  extractJobData: () => ({
    companyName: text(".job-details-jobs-unified-top-card__company-name") || text(".jobs-unified-top-card__company-name") || "Unknown company",
    jobTitle: text(".job-details-jobs-unified-top-card__job-title") || text(".jobs-unified-top-card__job-title") || document.title.split("|")[0].trim(),
    location: text(".job-details-jobs-unified-top-card__primary-description-container") || text(".jobs-unified-top-card__bullet"),
    salary: text(".job-details-preferences-and-skills__pill") || null,
    employmentType: text(".job-details-jobs-unified-top-card__job-insight") || null,
    jobDescription: descriptionFromSelectors([".jobs-description-content__text", ".jobs-box__html-content", ".jobs-description"]),
    applicationUrl: window.location.href,
    sourcePlatform: "LinkedIn",
    rawHtml: document.documentElement.outerHTML
  })
};
