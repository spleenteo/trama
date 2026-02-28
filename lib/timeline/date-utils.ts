import type { EventSummary } from '@/lib/types';

export function eventToFractionalYear(event: {
  year: number;
  month: number | null;
  day: number | null;
}): number {
  const month = event.month ?? 1;
  const day = event.day ?? 1;
  // Approximate: day-of-year / 365
  const dayOfYear = (month - 1) * 30.44 + day;
  return event.year + (dayOfYear - 1) / 365;
}

export function computeTimelineRange(
  events: EventSummary[],
  softStart?: number | null,
  softEnd?: number | null
): { minYear: number; maxYear: number } {
  const years = events.flatMap((e) => {
    const start = eventToFractionalYear(e);
    const end = e.endYear ? eventToFractionalYear({ year: e.endYear, month: e.endMonth, day: e.endDay }) : start;
    return [start, end];
  });

  const currentYear = new Date().getFullYear();

  if (years.length === 0) {
    const min = softStart ?? currentYear - 10;
    const max = softEnd ?? currentYear;
    return { minYear: min, maxYear: max };
  }

  return {
    minYear: Math.min(...years, ...(softStart != null ? [softStart] : [])),
    maxYear: Math.max(...years, ...(softEnd != null ? [softEnd] : [currentYear])),
  };
}

export function sortEventsByDate(events: EventSummary[]): EventSummary[] {
  return [...events].sort(
    (a, b) => eventToFractionalYear(a) - eventToFractionalYear(b)
  );
}

export function formatTimelineDate(
  year: number,
  month?: number | null,
  day?: number | null
): string {
  const absYear = Math.abs(year);
  const era = year < 0 ? ' a.C.' : '';

  if (!month) return `${absYear}${era}`;

  const monthNames = [
    'gen', 'feb', 'mar', 'apr', 'mag', 'giu',
    'lug', 'ago', 'set', 'ott', 'nov', 'dic',
  ];
  const monthStr = monthNames[(month - 1) % 12];

  if (!day) return `${monthStr} ${absYear}${era}`;
  return `${day} ${monthStr} ${absYear}${era}`;
}

export function formatDuration(
  startYear: number, startMonth: number | null,
  endYear: number, endMonth: number | null
): string {
  const totalMonths =
    (endYear - startYear) * 12 + ((endMonth ?? 1) - (startMonth ?? 1));
  if (totalMonths < 0) return '';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'anno' : 'anni'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'mese' : 'mesi'}`);
  return parts.join(' e ') || 'meno di un mese';
}
