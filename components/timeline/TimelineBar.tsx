'use client';

import { yearToPixel } from '@/lib/timeline/scale';

interface Props {
  title: string;
  color: string | null;
  minYear: number;
  maxYear: number;
  numChildren: number;
  viewportStart: number;
  pixelsPerYear: number;
  axisY: number;
  width: number;
  nodeId?: string;
  onSelectInfo?: (id: string) => void;
}

// Must match SubTimelineBars constants
const CHILD_SLOT_HEIGHT = 16 + 28 + 8; // BAR_HEIGHT + LABEL_HEIGHT + BAR_GAP
const CHILD_AXIS_CLEARANCE = 40;
const SELF_BAR_HEIGHT = 24;
const SELF_BAR_GAP = 12;
const INFO_SIZE = 16;

function formatYear(year: number): string {
  const y = Math.round(year);
  if (y < 0) return `${Math.abs(y)} a.C.`;
  return `${y}`;
}

export default function TimelineBar({
  title,
  color,
  minYear,
  maxYear,
  numChildren,
  viewportStart,
  pixelsPerYear,
  axisY,
  width,
  nodeId,
  onSelectInfo,
}: Props) {
  const xStartRaw = yearToPixel(minYear, viewportStart, pixelsPerYear);
  const xEndRaw = yearToPixel(maxYear, viewportStart, pixelsPerYear);

  // Clamp bar to viewport
  const xBar = Math.max(0, xStartRaw);
  const xBarEnd = Math.min(width, xEndRaw);
  const barWidth = xBarEnd - xBar;

  if (barWidth <= 0) return null;

  const stackHeight = CHILD_AXIS_CLEARANCE + Math.max(numChildren, 0) * CHILD_SLOT_HEIGHT;
  const y = Math.max(4, axisY - stackHeight - SELF_BAR_GAP - SELF_BAR_HEIGHT);

  const fill = color ?? '#94a3b8';

  // Pin title to visible left edge
  const titleX = Math.max(xBar + 12, 12);
  const dateText = `${formatYear(minYear)} – ${formatYear(maxYear)}`;
  const dateX = xBarEnd - 12;

  const showTitle = barWidth > 160;
  const showDates = barWidth > 60;
  const showOnlyDates = !showTitle && showDates;

  // Info icon — to the left of the visible bar
  const infoX = xBar - INFO_SIZE - 6;
  const infoY = y + (SELF_BAR_HEIGHT - INFO_SIZE) / 2;

  return (
    <g>
      {/* Info icon */}
      {nodeId && onSelectInfo && (
        <g
          className="cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onSelectInfo(nodeId);
          }}
          role="button"
          aria-label={`Info: ${title}`}
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
            stroke={fill}
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
            fill={fill}
            style={{ pointerEvents: 'none' }}
          >
            i
          </text>
        </g>
      )}

      {/* Bar fill */}
      <rect
        x={xBar}
        y={y}
        width={barWidth}
        height={SELF_BAR_HEIGHT}
        rx={5}
        fill={fill}
        opacity={0.18}
      />
      {/* Bar border */}
      <rect
        x={xBar}
        y={y}
        width={barWidth}
        height={SELF_BAR_HEIGHT}
        rx={5}
        fill="none"
        stroke={fill}
        strokeWidth={1.5}
        opacity={0.55}
      />

      {/* Title — left-aligned, pinned to visible area */}
      {showTitle && (
        <text
          x={titleX}
          y={y + SELF_BAR_HEIGHT / 2 + 4}
          fontSize={14}
          fontWeight="700"
          fill={fill}
          opacity={0.9}
          fontFamily="ui-sans-serif, sans-serif"
        >
          {title.length > 48 ? title.slice(0, 46) + '…' : title}
        </text>
      )}

      {/* Date range — right-aligned */}
      {showDates && dateX > titleX + 60 && (
        <text
          x={dateX}
          y={y + SELF_BAR_HEIGHT / 2 + 4}
          textAnchor="end"
          fontSize={12}
          fill={fill}
          opacity={0.75}
          fontFamily="ui-monospace, monospace"
        >
          {showOnlyDates ? `${title.slice(0, 20)} · ${dateText}` : dateText}
        </text>
      )}

      {/* Start year tick */}
      {xStartRaw >= -2 && xStartRaw <= width && (
        <line
          x1={xStartRaw}
          y1={y + SELF_BAR_HEIGHT}
          x2={xStartRaw}
          y2={y + SELF_BAR_HEIGHT + 4}
          stroke={fill}
          strokeWidth={1}
          opacity={0.5}
        />
      )}
      {/* End year tick */}
      {xEndRaw >= 0 && xEndRaw <= width + 2 && (
        <line
          x1={xEndRaw}
          y1={y + SELF_BAR_HEIGHT}
          x2={xEndRaw}
          y2={y + SELF_BAR_HEIGHT + 4}
          stroke={fill}
          strokeWidth={1}
          opacity={0.5}
        />
      )}
    </g>
  );
}
