'use client';

import { useRouter } from 'next/navigation';
import type { NodeTree } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { formatYearRange } from '@/lib/timeline/date-utils';
import { computeTreeRanges } from '@/lib/timeline/tree-utils';
import { useTimelineStore } from '@/lib/store';
import { clampLabelX, visibleBarWidth } from '@/components/timeline/SubTimelineBars';
import { useDrag } from '@/lib/timeline/drag-context';

interface Props {
  siblings: NodeTree[];
  viewportStart: number;
  pixelsPerYear: number;
  width: number;
  onSelectInfo?: (id: string) => void;
  /** Y position to start stacking ghost bars downward from */
  topY: number;
}

const BAR_HEIGHT = 16;
const LABEL_HEIGHT = 28;
const BAR_GAP = 8;
const SLOT_HEIGHT = BAR_HEIGHT + LABEL_HEIGHT + BAR_GAP;
const INFO_SIZE = 16;
const MIN_LABEL_WIDTH = 40;
const GHOST_OPACITY = 0.15;

export default function GhostBars({ siblings, viewportStart, pixelsPerYear, width, onSelectInfo, topY }: Props) {
  const router = useRouter();
  const hiddenSiblingIds = useTimelineStore((s) => s.hiddenSiblingIds);
  const { state: dragState } = useDrag();

  const visible = siblings.filter((s) => !hiddenSiblingIds.has(s.id));
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

        // Stack downward from top: label above bar
        const barY = topY + LABEL_HEIGHT + i * SLOT_HEIGHT;
        const color = sib.color?.hex ?? '#9ca3af';

        // Sticky label
        const labelX = clampLabelX(rawX1, rawX2, width);
        const visWidth = visibleBarWidth(rawX1, rawX2, width);
        const isNarrow = visWidth <= MIN_LABEL_WIDTH;
        const rangeLabel = formatYearRange(Math.round(start), Math.round(end));

        // Info icon
        const infoX = Math.max(rawX1, 0) - INFO_SIZE - 4;
        const infoY = barY + (BAR_HEIGHT - INFO_SIZE) / 2;

        return (
          <g key={sib.id}>
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
            {(() => {
              const isDropTarget = dragState.draggingEventId != null && dragState.dropTargetId === sib.id;
              return (
            <g
              className="cursor-pointer"
              onClick={() => router.push(`/timeline/${sib.slug}`)}
              role="button"
              aria-label={`Naviga in: ${sib.title}`}
              style={{ pointerEvents: 'auto' }}
              data-drop-id={sib.id}
            >
              <title>{`${sib.title} — clicca per navigare`}</title>
              {/* Hit area (wider for narrow bars) */}
              {(() => {
                const displayTitle = sib.title.length > 32 ? sib.title.slice(0, 30) + '…' : sib.title;
                const titleWidth = displayTitle.length * 7.5;
                const hitWidth = isNarrow ? barWidth + titleWidth + 24 : barWidth;
                return <rect x={x1} y={barY - LABEL_HEIGHT - 2} width={hitWidth} height={BAR_HEIGHT + LABEL_HEIGHT + 4} fill="transparent" data-drop-id={sib.id} />;
              })()}
              <rect
                x={x1} y={barY}
                width={barWidth} height={BAR_HEIGHT}
                rx={BAR_HEIGHT / 2}
                fill={isDropTarget ? '#3b82f6' : color}
                opacity={isDropTarget ? 0.7 : GHOST_OPACITY}
                stroke={isDropTarget ? '#3b82f6' : 'none'}
                strokeWidth={isDropTarget ? 2 : 0}
                style={{ transition: 'opacity 0.2s ease' }}
                onMouseEnter={(e) => { if (!isDropTarget) (e.target as SVGRectElement).setAttribute('opacity', '0.55'); }}
                onMouseLeave={(e) => { if (!isDropTarget) (e.target as SVGRectElement).setAttribute('opacity', String(GHOST_OPACITY)); }}
              />
              {/* Label above bar: always visible */}
              {(() => {
                const displayTitle = sib.title.length > 32 ? sib.title.slice(0, 30) + '…' : sib.title;
                const titleWidth = displayTitle.length * 7.5;
                const rangeWidth = rangeLabel ? rangeLabel.length * 7 : 0;
                const showRange = !isNarrow && rangeLabel && visWidth > titleWidth + rangeWidth + 40;
                const titleX = isNarrow ? x1 + barWidth + 6 : labelX;
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <text
                      x={titleX}
                      y={barY - 5}
                      fontSize={12}
                      fill={color}
                      fontWeight="500"
                      fontFamily="ui-sans-serif, sans-serif"
                      opacity={0.6}
                    >
                      {displayTitle}
                    </text>
                    {showRange && (
                      <text
                        x={Math.min(rawX2, width) - 12}
                        y={barY - 5}
                        textAnchor="end"
                        fontSize={11}
                        fill={color}
                        fontWeight="600"
                        fontFamily="ui-monospace, monospace"
                        opacity={0.5}
                      >
                        {rangeLabel}
                      </text>
                    )}
                  </g>
                );
              })()}
            </g>
              );
            })()}
          </g>
        );
      })}
    </g>
  );
}
