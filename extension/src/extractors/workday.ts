import { descriptionFromSelectors, JobExtractor, text } from "./types";

export const workdayExtractor: JobExtractor = {
  platform: "Workday",
  matches: (url) => url.hostname.includes("myworkdayjobs.com"),
  extractJobData: () => ({
    companyName: window.location.hostname.split(".")[0],
    jobTitle: text("[data-automation-id='jobPostingHeader']") || text("h1") || document.title,
    location: text("[data-automation-id='locations']") || text("[data-automation-id='location']") || null,
    salary: text("[data-automation-id='compensation']") || null,
    employmentType: text("[data-automation-id='timeType']") || null,
    jobDescription: descriptionFromSelectors(["[data-automation-id='jobPostingDescription']", "main", "body"]),
    applicationUrl: window.location.href,
    sourcePlatform: "Workday",
    rawHtml: document.documentElement.outerHTML
  })
};
