import { greenhouseExtractor } from "./greenhouse";
import { JobExtractor } from "./types";
import { leverExtractor } from "./lever";
import { linkedinExtractor } from "./linkedin";
import { workdayExtractor } from "./workday";

export const extractors: JobExtractor[] = [
  linkedinExtractor,
  greenhouseExtractor,
  leverExtractor,
  workdayExtractor
];

export function getExtractor(url = new URL(window.location.href)) {
  return extractors.find((extractor) => extractor.matches(url));
}
