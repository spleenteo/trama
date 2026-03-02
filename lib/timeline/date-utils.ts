import type { NodeSummary } from '@/lib/types';

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
  events: NodeSummary[],
  contextYear?: number | null,
  contextEndYear?: number | null,
  children?: { year: number; endYear?: number | null; computedMin?: number | null; computedMax?: number | null }[]
): { minYear: number; maxYear: number } {
  const years = events.flatMap((e) => {
    const start = eventToFractionalYear(e);
    const end = e.endYear ? eventToFractionalYear({ year: e.endYear, month: e.endMonth, day: e.endDay }) : start;
    return [start, end];
  });

  const childYears = (children ?? []).flatMap((c) => {
    const pts: number[] = [];
    if (c.computedMin != null) pts.push(c.computedMin);
    else pts.push(c.year);
    if (c.computedMax != null) pts.push(c.computedMax);
    else if (c.endYear != null) pts.push(c.endYear);
    return pts;
  });

  const currentYear = new Date().getFullYear();

  if (years.length === 0 && childYears.length === 0) {
    const min = contextYear ?? currentYear - 10;
    const max = contextEndYear ?? currentYear;
    return { minYear: min, maxYear: max };
  }

  return {
    minYear: Math.min(...years, ...childYears, ...(contextYear != null ? [contextYear] : [])),
    maxYear: Math.max(...years, ...childYears, ...(contextEndYear != null ? [contextEndYear] : [currentYear])),
  };
}

export function sortEventsByDate(events: NodeSummary[]): NodeSummary[] {
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

export function formatYearRange(
  start: number | null,
  end: number | null,
  isConcluded?: boolean | null,
): string | null {
  if (!start && !end) return null;
  const fmt = (y: number) => (y < 0 ? `${Math.abs(y)} a.C.` : `${y}`);
  if (start && end) return `${fmt(start)} — ${fmt(end)}`;
  if (start && !isConcluded) return `dal ${fmt(start)}`;
  if (start) return `${fmt(start)}`;
  return null;
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
