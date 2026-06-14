import { descriptionFromSelectors, JobExtractor, text } from "./types";

export const greenhouseExtractor: JobExtractor = {
  platform: "Greenhouse",
  matches: (url) => url.hostname.includes("greenhouse.io"),
  extractJobData: () => ({
    companyName: text("#header .company-name") || text(".app-title") || window.location.hostname.split(".")[0],
    jobTitle: text("h1") || document.title,
    location: text(".location") || null,
    salary: text(".salary") || null,
    employmentType: null,
    jobDescription: descriptionFromSelectors(["#content", ".job__description", ".content"]),
    applicationUrl: window.location.href,
    sourcePlatform: "Greenhouse",
    rawHtml: document.documentElement.outerHTML
  })
};
