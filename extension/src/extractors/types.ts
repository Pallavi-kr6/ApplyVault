import { ExtractedJobData } from "../lib/types";

export type JobExtractor = {
  platform: string;
  matches(url: URL): boolean;
  extractJobData(): ExtractedJobData;
};

export function text(selector: string) {
  return document.querySelector(selector)?.textContent?.trim() ?? "";
}

export function meta(name: string) {
  return document.querySelector<HTMLMetaElement>(`meta[name="${name}"], meta[property="${name}"]`)?.content?.trim() ?? "";
}

export function descriptionFromSelectors(selectors: string[]) {
  for (const selector of selectors) {
    const value = text(selector);
    if (value.length > 80) return value;
  }
  return document.body.innerText.trim();
}
