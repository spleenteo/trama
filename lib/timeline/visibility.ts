import type { EventSummary, Visibility } from '@/lib/types';

// Thresholds in pixels-per-year
// These will be calibrated experimentally
const SUPER_ONLY_THRESHOLD = 0.001;   // < 0.001 ppy → only super
const MAIN_THRESHOLD = 0.1;           // < 0.1 ppy → super + main
                                       // >= 0.1 ppy → all

export const VISIBILITY_THRESHOLDS = {
  superOnly: SUPER_ONLY_THRESHOLD,
  main: MAIN_THRESHOLD,
};

export function getVisibleEvents(
  events: EventSummary[],
  pixelsPerYear: number
): EventSummary[] {
  let allowed: Visibility[];

  if (pixelsPerYear < SUPER_ONLY_THRESHOLD) {
    allowed = ['super'];
  } else if (pixelsPerYear < MAIN_THRESHOLD) {
    allowed = ['super', 'main'];
  } else {
    allowed = ['super', 'main', 'regular'];
  }

  return events.filter((e) => allowed.includes(e.visibility));
}
