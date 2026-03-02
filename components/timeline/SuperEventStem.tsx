'use client';

import type { NodeSummary } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { eventToFractionalYear } from '@/lib/timeline/date-utils';
import { SUPER_CARD_W, STEM_BASE, LEVEL_STEP } from './SuperEventMarker';

interface Props {
  event: NodeSummary;
  viewportStart: number;
  pixelsPerYear: number;
  axisY: number;
  width: number;
  level: number;
  color?: string;
}

export default function SuperEventStem({
  event,
  viewportStart,
  pixelsPerYear,
  axisY,
  width,
  level,
  color: colorProp,
}: Props) {
  const frac = eventToFractionalYear(event);
  const x = yearToPixel(frac, viewportStart, pixelsPerYear);

  if (x < -(SUPER_CARD_W / 2 + 20) || x > width + SUPER_CARD_W / 2 + 20) return null;

  const color = colorProp ?? '#6b7280';
  const stemEnd = axisY + STEM_BASE + level * LEVEL_STEP;

  return (
    <g>
      {/* Stem line from axis down to marker position */}
      <line
        x1={x} y1={axisY}
        x2={x} y2={stemEnd}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.4}
      />
      {/* Axis tick dot */}
      <circle cx={x} cy={axisY} r={3} fill={color} opacity={0.8} />
    </g>
  );
}
