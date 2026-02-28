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

export function getAxisLabels(
  viewportStart: number,
  viewportEnd: number,
  viewportWidthPx: number,
  minSpacingPx = 100
): AxisLabel[] {
  const range = viewportEnd - viewportStart;
  const pixelsPerYear = viewportWidthPx / range;
  const maxLabels = Math.floor(viewportWidthPx / minSpacingPx);
  const step = pickStep(range, maxLabels);

  const start = Math.ceil(viewportStart / step) * step;
  const labels: AxisLabel[] = [];

  for (let y = start; y <= viewportEnd; y += step) {
    labels.push({
      year: y,
      label: formatAxisYear(y, range),
      x: yearToPixel(y, viewportStart, pixelsPerYear),
    });
  }

  return labels;
}

function pickStep(range: number, maxLabels: number): number {
  const raw = range / maxLabels;
  const candidates = [
    1, 2, 5, 10, 25, 50, 100, 250, 500, 1_000, 2_000, 5_000, 10_000,
    50_000, 100_000, 1_000_000, 10_000_000, 100_000_000, 1_000_000_000,
  ];
  return candidates.find((c) => c >= raw) ?? candidates[candidates.length - 1];
}

function formatAxisYear(year: number, range: number): string {
  const absYear = Math.abs(year);
  const suffix = year < 0 ? ' a.C.' : '';

  if (range > 500_000_000) {
    const billions = absYear / 1_000_000_000;
    return billions >= 1
      ? `${billions.toFixed(1)} mld anni${suffix}`
      : `${(absYear / 1_000_000).toFixed(0)} mln anni${suffix}`;
  }
  if (range > 1_000_000) {
    return `${(absYear / 1_000_000).toFixed(1)} mln${suffix}`;
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
