import type { NodeSummary } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { eventToFractionalYear } from '@/lib/timeline/date-utils';

/**
 * Anti-collision level assignment for point events.
 * Returns a map from event ID → level (0-based) so that card bounding boxes
 * (width = cardWidth) never overlap horizontally within the same level.
 */
export function assignLevels(
  events: NodeSummary[],
  viewportStart: number,
  pixelsPerYear: number,
  cardWidth: number,
): Map<string, number> {
  const sorted = [...events].sort((a, b) => {
    const xa = yearToPixel(eventToFractionalYear(a), viewportStart, pixelsPerYear);
    const xb = yearToPixel(eventToFractionalYear(b), viewportStart, pixelsPerYear);
    return xa - xb;
  });

  const levels = new Map<string, number>();
  const occupied: [number, number][][] = [];

  for (const ev of sorted) {
    const x = yearToPixel(eventToFractionalYear(ev), viewportStart, pixelsPerYear);
    const lo = x - cardWidth / 2;
    const hi = x + cardWidth / 2;

    let L = 0;
    while (true) {
      if (!occupied[L]) occupied[L] = [];
      const overlaps = occupied[L].some(([a, b]) => lo < b && hi > a);
      if (!overlaps) break;
      L++;
    }

    levels.set(ev.id, L);
    occupied[L].push([lo, hi]);
  }

  return levels;
}
