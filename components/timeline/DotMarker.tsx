'use client';

import type { ChildEvent } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { eventToFractionalYear, formatTimelineDate } from '@/lib/timeline/date-utils';

interface Props {
  event: ChildEvent;
  viewportStart: number;
  pixelsPerYear: number;
  axisY: number;
  width: number;
  onSelect: (id: string) => void;
}

const R = 4;

export default function DotMarker({ event, viewportStart, pixelsPerYear, axisY, width, onSelect }: Props) {
  const frac = eventToFractionalYear(event);
  const x = yearToPixel(frac, viewportStart, pixelsPerYear);

  if (x < -20 || x > width + 20) return null;

  const fill = event.sourceContextColor ?? '#9ca3af';
  const label = `${event.title} — ${formatTimelineDate(event.year, event.month, event.day)}`;

  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(event.id)}
      role="button"
      aria-label={label}
    >
      <title>{label}</title>
      {/* Hit area */}
      <circle cx={x} cy={axisY} r={R + 8} fill="transparent" />
      {/* Dot */}
      <circle
        cx={x}
        cy={axisY}
        r={R}
        fill={fill}
        stroke="white"
        strokeWidth={1.5}
        opacity={0.85}
      />
    </g>
  );
}
