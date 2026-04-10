'use client';

import { useRouter } from 'next/navigation';
import type { NodeBase } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { formatYearRange } from '@/lib/timeline/date-utils';
import { useDrag } from '@/lib/timeline/drag-context';
import type { EventDot } from '@/components/timeline/TimelineCanvas';

interface ChildWithRange extends NodeBase {
  computedMin?: number | null;
  computedMax?: number | null;
  children?: unknown[];
}

interface Props {
  children: ChildWithRange[];
  viewportStart: number;
  pixelsPerYear: number;
  width: number;
  axisY: number;
  onSelectInfo?: (id: string) => void;
  eventDotsMap?: Map<string, EventDot[]>;
}

const BAR_HEIGHT = 16;
const LABEL_HEIGHT = 28;       // space for name + range above the bar
const BAR_GAP = 8;             // gap between label area of one bar and bar of the next
const SLOT_HEIGHT = BAR_HEIGHT + LABEL_HEIGHT + BAR_GAP;
const AXIS_CLEARANCE = 40;
const INFO_SIZE = 16;
const LABEL_PADDING = 12;
const MIN_LABEL_WIDTH = 40;

/** Clamp label X so it stays within the visible portion of a bar */
export function clampLabelX(barX1: number, barX2: number, viewportWidth: number): number {
  const visibleLeft = Math.max(barX1, 0);
  const visibleRight = Math.min(barX2, viewportWidth);
  return Math.min(visibleLeft + LABEL_PADDING, visibleRight - LABEL_PADDING);
}

/** Visible width of a bar within the viewport */
export function visibleBarWidth(barX1: number, barX2: number, viewportWidth: number): number {
  return Math.min(barX2, viewportWidth) - Math.max(barX1, 0);
}

const DOT_Y_OFFSET = 6; // space below the bar for dots
const DOT_R_REGULAR = 2;
const DOT_R_PROMOTED = 3.5;

export default function SubTimelineBars({ children, viewportStart, pixelsPerYear, width, axisY, onSelectInfo, eventDotsMap }: Props) {
  const router = useRouter();
  const { state: dragState } = useDrag();

  const THIS_YEAR = new Date().getFullYear();
  const visible = children.filter((c) => {
    const start = c.computedMin ?? c.year;
    const end = c.toPresent ? THIS_YEAR : (c.computedMax ?? c.endYear ?? null);
    return start != null && end != null;
  });

  if (visible.length === 0) return null;

  return (
    <g>
      {visible.map((child, i) => {
        const start = child.computedMin ?? child.year;
        const end = child.toPresent ? THIS_YEAR : (child.computedMax ?? child.endYear ?? child.year);
        const rawX1 = yearToPixel(start, viewportStart, pixelsPerYear);
        const rawX2 = yearToPixel(end, viewportStart, pixelsPerYear);
        const x1 = Math.max(0, rawX1);
        const x2 = Math.min(width, rawX2);
        const barWidth = Math.max(4, x2 - x1);
        // Bar Y: grows upward from axis
        const barY = axisY - AXIS_CLEARANCE - BAR_HEIGHT - i * SLOT_HEIGHT;
        const color = child.color?.hex ?? '#9ca3af';
        const isNavigable = (child.children?.length ?? 0) > 0;
        const isDropTarget = dragState.draggingEventId != null && dragState.dropTargetId === child.id;

        // Sticky label position
        const labelX = clampLabelX(rawX1, rawX2, width);
        const visWidth = visibleBarWidth(rawX1, rawX2, width);
        const isNarrow = visWidth <= MIN_LABEL_WIDTH;
        const rangeLabel = formatYearRange(Math.round(start), Math.round(end), child.toPresent);

        // Info icon
        const infoX = Math.max(rawX1, 0) - INFO_SIZE - 4;
        const infoY = barY + (BAR_HEIGHT - INFO_SIZE) / 2;

        return (
          <g key={child.id}>
            {/* Info icon */}
            {onSelectInfo && (
              <g
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectInfo(child.id);
                }}
                role="button"
                aria-label={`Info: ${child.title}`}
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
                  opacity={0.9}
                />
                <text
                  x={infoX + INFO_SIZE / 2}
                  y={infoY + INFO_SIZE / 2 + 4}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight="700"
                  fontFamily="ui-serif, Georgia, serif"
                  fill={color}
                  style={{ pointerEvents: 'none' }}
                >
                  i
                </text>
              </g>
            )}

            {/* Bar + label */}
            <g
              className={isNavigable ? 'cursor-pointer' : undefined}
              onClick={isNavigable ? () => router.push(`/timeline/${child.slug}`) : undefined}
              role={isNavigable ? 'button' : undefined}
              aria-label={isNavigable ? `Naviga in: ${child.title}` : child.title}
              style={{ pointerEvents: 'auto' }}
              data-drop-id={child.id}
            >
              {isNavigable && <title>{`${child.title} — clicca per navigare`}</title>}
              {/* Hit area covers bar + label (wider for narrow bars) */}
              {(() => {
                const displayTitle = child.title.length > 32 ? child.title.slice(0, 30) + '…' : child.title;
                const titleWidth = displayTitle.length * 7.5;
                const hitWidth = isNarrow ? barWidth + titleWidth + LABEL_PADDING * 2 : barWidth;
                return <rect x={x1} y={barY - LABEL_HEIGHT - 2} width={hitWidth} height={BAR_HEIGHT + LABEL_HEIGHT + 4} fill="transparent" data-drop-id={child.id} />;
              })()}
              {/* Bar */}
              <rect
                x={x1} y={barY}
                width={barWidth} height={BAR_HEIGHT}
                rx={BAR_HEIGHT / 2}
                fill={isDropTarget ? '#3b82f6' : color}
                opacity={isDropTarget ? 0.7 : 0.55}
                stroke={isDropTarget ? '#3b82f6' : 'none'}
                strokeWidth={isDropTarget ? 2 : 0}
              />
              {/* Label above bar: always visible */}
              {(() => {
                const displayTitle = child.title.length > 32 ? child.title.slice(0, 30) + '…' : child.title;
                const titleWidth = displayTitle.length * 7.5;
                const rangeWidth = rangeLabel ? rangeLabel.length * 7 : 0;
                const showRange = !isNarrow && rangeLabel && visWidth > titleWidth + rangeWidth + 40;
                // For narrow bars, place title right after the bar end
                const titleX = isNarrow ? x1 + barWidth + 6 : labelX;
                return (
                  <g style={{ pointerEvents: 'none' }}>
                    <text
                      x={titleX}
                      y={barY - 5}
                      fontSize={12}
                      fill={color}
                      fontWeight="600"
                      fontFamily="ui-sans-serif, sans-serif"
                    >
                      {displayTitle}
                    </text>
                    {showRange && (
                      <text
                        x={Math.min(rawX2, width) - LABEL_PADDING}
                        y={barY - 5}
                        textAnchor="end"
                        fontSize={11}
                        fill={color}
                        fontWeight="600"
                        fontFamily="ui-monospace, monospace"
                        opacity={0.8}
                      >
                        {rangeLabel}
                      </text>
                    )}
                  </g>
                );
              })()}
            </g>

            {/* Event dots below the bar */}
            {eventDotsMap?.get(child.id)?.map((dot, di) => {
              const dotX = yearToPixel(dot.year, viewportStart, pixelsPerYear);
              if (dotX < -4 || dotX > width + 4) return null;
              const promoted = dot.visibility === 'main' || dot.visibility === 'super';
              const r = promoted ? DOT_R_PROMOTED : DOT_R_REGULAR;
              return (
                <circle
                  key={di}
                  cx={dotX}
                  cy={barY + BAR_HEIGHT + DOT_Y_OFFSET + r}
                  r={r}
                  fill={color}
                  opacity={promoted ? 0.9 : 0.35}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
