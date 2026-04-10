// ─── Core conversion functions ────────────────────────────────────────────────

export function yearToPixel(
  year: number,
  viewportStart: number,
  pixelsPerYear: number
): number {
  return (year - viewportStart) * pixelsPerYear;
}

export function pixelToYear(
  x: number,
  viewportStart: number,
  pixelsPerYear: number
): number {
  return viewportStart + x / pixelsPerYear;
}

// ─── Axis labels ─────────────────────────────────────────────────────────────

export interface AxisLabel {
  year: number;
  label: string;
  x: number;
}

export interface AxisLabelResult {
  labels: AxisLabel[];
  step: number;
}

export function getAxisLabels(
  viewportStart: number,
  viewportEnd: number,
  viewportWidthPx: number,
  minSpacingPx = 120
): AxisLabelResult {
  const range = viewportEnd - viewportStart;
  const pixelsPerYear = viewportWidthPx / range;
  const maxLabels = Math.floor(viewportWidthPx / minSpacingPx);
  const step = pickStep(range, maxLabels);

  const startIndex = Math.ceil(viewportStart / step);
  const endIndex = Math.floor(viewportEnd / step);
  const labels: AxisLabel[] = [];

  for (let i = startIndex; i <= endIndex; i++) {
    const y = i * step;
    labels.push({
      year: y,
      label: formatAxisYear(y, range),
      x: yearToPixel(y, viewportStart, pixelsPerYear),
    });
  }

  return { labels, step };
}

function pickStep(range: number, maxLabels: number): number {
  const raw = range / maxLabels;
  const candidates = [
    1 / 12, // 1 month
    1 / 4,  // 3 months (quarter)
    1 / 2,  // 6 months (semester)
    1, 2, 5, 10, 25, 50, 100, 250, 500, 1_000, 2_000, 5_000, 10_000,
    50_000, 100_000, 1_000_000, 10_000_000, 100_000_000,
    1_000_000_000, 2_000_000_000, 5_000_000_000, 10_000_000_000,
  ];
  return candidates.find((c) => c >= raw) ?? candidates[candidates.length - 1];
}

const MONTH_NAMES = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];

function formatAxisYear(year: number, range: number): string {
  // Sub-year range: show month labels
  if (range < 2) {
    const wholeYear = Math.floor(year);
    const frac = year - wholeYear;
    const monthIndex = Math.round(frac * 12);
    if (monthIndex > 0 && monthIndex <= 12) {
      return `${MONTH_NAMES[monthIndex - 1]} ${wholeYear}`;
    }
    // Whole year boundary
    return `${wholeYear}`;
  }

  const absYear = Math.abs(year);
  const suffix = year < 0 ? ' a.C.' : '';

  if (range > 500_000_000) {
    const billions = absYear / 1_000_000_000;
    if (billions >= 1) {
      const s = Number.isInteger(billions) ? `${billions}` : `${billions.toFixed(1)}`;
      return `${s} mld${suffix}`;
    }
    return `${(absYear / 1_000_000).toFixed(0)} mln${suffix}`;
  }
  if (range > 1_000_000) {
    const mln = absYear / 1_000_000;
    const s = Number.isInteger(mln) ? `${mln}` : `${mln.toFixed(1)}`;
    return `${s} mln${suffix}`;
  }
  if (absYear === 0) return '0';
  if (year < 0) return `${absYear} a.C.`;
  return `${year}`;
}

// ─── Fit-to-view ──────────────────────────────────────────────────────────────

export function computeFitToView(
  minYear: number,
  maxYear: number,
  viewportWidthPx: number,
  paddingFraction = 0.05
): { viewportStart: number; pixelsPerYear: number } {
  const range = maxYear - minYear || 1;
  const padding = range * paddingFraction;
  const start = minYear - padding;
  const end = maxYear + padding;
  const ppy = viewportWidthPx / (end - start);
  return { viewportStart: start, pixelsPerYear: ppy };
}

export function getZoomLevelForRange(
  startYear: number,
  endYear: number,
  viewportWidthPx: number
): number {
  const { pixelsPerYear } = computeFitToView(startYear, endYear, viewportWidthPx);
  return pixelsPerYear;
}
