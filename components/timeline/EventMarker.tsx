'use client';

import type { EventSummary } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { eventToFractionalYear, formatTimelineDate } from '@/lib/timeline/date-utils';

interface Props {
  event: EventSummary;
  viewportStart: number;
  pixelsPerYear: number;
  canvasHeight: number;
  axisY: number;
  onSelect: (id: string) => void;
  color?: string;
}

const MARKER_RADIUS = 5;
const BAR_HEIGHT = 10;
const STEM_LENGTH = 28;

// Shape by event type
function markerShape(type: string, x: number, y: number, r: number, color: string) {
  switch (type) {
    case 'key_moment':
      // Filled circle (bigger)
      return <circle cx={x} cy={y} r={r + 2} fill={color} stroke="white" strokeWidth={1.5} />;
    case 'incident':
      // Diamond
      return (
        <polygon
          points={`${x},${y - r - 2} ${x + r + 2},${y} ${x},${y + r + 2} ${x - r - 2},${y}`}
          fill={color}
          stroke="white"
          strokeWidth={1.5}
        />
      );
    default:
      // Regular circle outline
      return <circle cx={x} cy={y} r={r} fill="white" stroke={color} strokeWidth={2} />;
  }
}

export default function EventMarker({
  event,
  viewportStart,
  pixelsPerYear,
  canvasHeight,
  axisY,
  onSelect,
  color: colorProp,
}: Props) {
  const color = colorProp ?? '#6b7280';
  const startFrac = eventToFractionalYear(event);
  const x = yearToPixel(startFrac, viewportStart, pixelsPerYear);

  // Out-of-viewport culling
  if (x < -100 || x > 10000) return null;

  const hasRange = event.endYear != null;

  if (hasRange) {
    const endFrac = eventToFractionalYear({
      year: event.endYear!,
      month: event.endMonth,
      day: event.endDay,
    });
    const x2 = yearToPixel(endFrac, viewportStart, pixelsPerYear);
    const barWidth = Math.max(4, x2 - x);
    // Range bars sit just below the axis
    const barY = axisY + 6;

    return (
      <g
        className="cursor-pointer"
        onClick={() => onSelect(event.id)}
        role="button"
        aria-label={event.title}
        style={{ pointerEvents: 'auto' }}
      >
        <title>{`${event.title} — ${formatTimelineDate(event.year, event.month, event.day)}`}</title>
        {/* Hover target */}
        <rect x={x} y={barY - 4} width={barWidth} height={BAR_HEIGHT + 16} fill="transparent" />
        {/* Bar */}
        <rect
          x={x}
          y={barY}
          width={barWidth}
          height={BAR_HEIGHT}
          rx={BAR_HEIGHT / 2}
          fill="#6b7280"
          opacity={0.7}
        />
        {/* Label */}
        <text
          x={x + barWidth / 2}
          y={barY + BAR_HEIGHT + 13}
          textAnchor="middle"
          fontSize={13}
          fill="#374151"
          fontFamily="ui-sans-serif, sans-serif"
        >
          {event.title.length > 24 ? event.title.slice(0, 22) + '…' : event.title}
        </text>
      </g>
    );
  }

  // Point event — stem goes DOWN from axis
  const shapeY = axisY + STEM_LENGTH;
  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(event.id)}
      role="button"
      aria-label={event.title}
    >
      <title>{`${event.title} — ${formatTimelineDate(event.year, event.month, event.day)}`}</title>
      {/* Hit area */}
      <circle cx={x} cy={axisY} r={MARKER_RADIUS + 8} fill="transparent" />
      {/* Stem */}
      <line x1={x} y1={axisY} x2={x} y2={shapeY} stroke="#d1d5db" strokeWidth={1} />
      {/* Shape */}
      {markerShape(event.eventType, x, shapeY, MARKER_RADIUS, '#6b7280')}
      {/* Label */}
      <text
        x={x}
        y={shapeY + MARKER_RADIUS + 14}
        textAnchor="middle"
        fontSize={13}
        fill="#374151"
        fontFamily="ui-sans-serif, sans-serif"
      >
        {event.title.length > 22 ? event.title.slice(0, 20) + '…' : event.title}
      </text>
    </g>
  );
}
