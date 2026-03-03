'use client';

import { useRouter } from 'next/navigation';
import type { NodeTree } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { formatYearRange } from '@/lib/timeline/date-utils';
import { computeTreeRanges } from '@/lib/timeline/tree-utils';
import { useTimelineStore } from '@/lib/store';
import { clampLabelX, visibleBarWidth } from '@/components/timeline/SubTimelineBars';

interface Props {
  siblings: NodeTree[];
  viewportStart: number;
  pixelsPerYear: number;
  width: number;
  onSelectInfo?: (id: string) => void;
  /** Y position of the top edge of the context bar — ghost bars stack above this */
  topY: number;
}

const BAR_HEIGHT = 20;
const BAR_GAP = 10;
const INFO_SIZE = 16;
const MIN_LABEL_WIDTH = 40;
const GHOST_OPACITY = 0.15;

export default function GhostBars({ siblings, viewportStart, pixelsPerYear, width, onSelectInfo, topY }: Props) {
  const router = useRouter();
  const visibleSiblingIds = useTimelineStore((s) => s.visibleSiblingIds);

  // Filter to only visible siblings
  const visible = siblings.filter((s) => visibleSiblingIds.has(s.id));
  if (visible.length === 0) return null;

  // Compute ranges for each visible sibling (considers their children)
  const rangeMap = new Map<string, { computedStart: number; computedEnd: number }>();
  for (const sib of visible) {
    const ranges = computeTreeRanges(sib);
    const range = ranges.get(sib.id);
    if (range) rangeMap.set(sib.id, range);
  }

  return (
    <g>
      {visible.map((sib, i) => {
        const range = rangeMap.get(sib.id);
        if (!range) return null;

        const { computedStart: start, computedEnd: end } = range;
        const rawX1 = yearToPixel(start, viewportStart, pixelsPerYear);
        const rawX2 = yearToPixel(end, viewportStart, pixelsPerYear);
        const x1 = Math.max(0, rawX1);
        const x2 = Math.min(width, rawX2);
        const barWidth = Math.max(4, x2 - x1);

        // Stack downward from the top of the canvas
        const y = topY + i * (BAR_HEIGHT + BAR_GAP);
        const color = sib.color?.hex ?? '#9ca3af';

        // Sticky label
        const labelX = clampLabelX(rawX1, rawX2, width);
        const visWidth = visibleBarWidth(rawX1, rawX2, width);
        const showLabel = visWidth > MIN_LABEL_WIDTH;
        const rangeLabel = formatYearRange(Math.round(start), Math.round(end));

        // Info icon
        const infoX = Math.max(rawX1, 0) - INFO_SIZE - 4;
        const infoY = y + (BAR_HEIGHT - INFO_SIZE) / 2;

        return (
          <g key={sib.id} className="ghost-bar">
            {/* Info icon */}
            {onSelectInfo && (
              <g
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectInfo(sib.id);
                }}
                role="button"
                aria-label={`Info: ${sib.title}`}
                style={{ pointerEvents: 'auto' }}
              >
                <rect
                  x={infoX - 2} y={infoY - 2}
                  width={INFO_SIZE + 4} height={INFO_SIZE + 4}
                  fill="transparent"
                />
                <circle
                  cx={infoX + INFO_SIZE / 2}
                  cy={infoY + INFO_SIZE / 2}
                  r={INFO_SIZE / 2}
                  fill="white"
                  stroke={color}
                  strokeWidth={1.5}
                  opacity={0.5}
                />
                <text
                  x={infoX + INFO_SIZE / 2}
                  y={infoY + INFO_SIZE / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="700"
                  fontFamily="ui-serif, Georgia, serif"
                  fill={color}
                  opacity={0.5}
                  style={{ pointerEvents: 'none' }}
                >
                  i
                </text>
              </g>
            )}

            {/* Bar — hover fades in, click navigates */}
            <g
              className="cursor-pointer"
              onClick={() => router.push(`/timeline/${sib.slug}`)}
              role="button"
              aria-label={`Naviga in: ${sib.title}`}
              style={{ pointerEvents: 'auto' }}
            >
              <title>{`${sib.title} — clicca per navigare`}</title>
              {/* Hit area */}
              <rect x={x1} y={y - 4} width={barWidth} height={BAR_HEIGHT + 8} fill="transparent" />
              {/* Bar with hover transition */}
              <rect
                x={x1} y={y}
                width={barWidth} height={BAR_HEIGHT}
                rx={BAR_HEIGHT / 2}
                fill={color}
                opacity={GHOST_OPACITY}
                style={{ transition: 'opacity 0.2s ease' }}
                onMouseEnter={(e) => { (e.target as SVGRectElement).setAttribute('opacity', '0.65'); }}
                onMouseLeave={(e) => { (e.target as SVGRectElement).setAttribute('opacity', String(GHOST_OPACITY)); }}
              />
              {/* Sticky label */}
              {showLabel && (
                <g style={{ pointerEvents: 'none' }}>
                  <text
                    x={labelX}
                    y={y + BAR_HEIGHT / 2 + 1}
                    fontSize={11}
                    fill={color}
                    fontWeight="500"
                    fontFamily="ui-sans-serif, sans-serif"
                    dominantBaseline="middle"
                    opacity={0.6}
                  >
                    {sib.title.length > 28 ? sib.title.slice(0, 26) + '…' : sib.title}
                  </text>
                  {rangeLabel && visWidth > 120 && (
                    <text
                      x={labelX}
                      y={y + BAR_HEIGHT / 2 + 13}
                      fontSize={9}
                      fill={color}
                      fontWeight="400"
                      fontFamily="ui-monospace, monospace"
                      opacity={0.4}
                    >
                      {rangeLabel}
                    </text>
                  )}
                </g>
              )}
            </g>
          </g>
        );
      })}
    </g>
  );
}
