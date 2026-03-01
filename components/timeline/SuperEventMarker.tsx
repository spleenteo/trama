'use client';

import type { EventSummary } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { eventToFractionalYear, formatTimelineDate } from '@/lib/timeline/date-utils';

interface Props {
  event: EventSummary;
  viewportStart: number;
  pixelsPerYear: number;
  axisY: number;
  width: number;
  level: number;
  color?: string;
  onSelect: (id: string) => void;
}

export const SUPER_CARD_W = 170;
const CARD_R = 6;
const MARKER_R = 5;
const STEM_BASE = 18;
export const LEVEL_STEP = 82; // tall enough for 2-line title cards + margin
const PAD = 8;
const LINE_H = 16; // px between title line baselines
const CHARS_PER_LINE = 22; // approx fit in 154px content width at 12px font

// Word-wrap: splits title into lines of at most CHARS_PER_LINE characters
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    if (current.length === 0) {
      current = word;
    } else if (current.length + 1 + word.length <= maxChars) {
      current += ' ' + word;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function SuperEventMarker({
  event,
  viewportStart,
  pixelsPerYear,
  axisY,
  width,
  level,
  color: colorProp,
  onSelect,
}: Props) {
  const frac = eventToFractionalYear(event);
  const x = yearToPixel(frac, viewportStart, pixelsPerYear);

  if (x < -(SUPER_CARD_W / 2 + 20) || x > width + SUPER_CARD_W / 2 + 20) return null;

  const color = colorProp ?? '#6b7280';
  const stemEnd = axisY + STEM_BASE + level * LEVEL_STEP;

  const titleLines = wrapText(event.title, CHARS_PER_LINE);
  const titleBlockH = titleLines.length * LINE_H;
  // card height: top-pad(12) + title block + gap(4) + date line(14) + bottom-pad(8)
  const cardH = 12 + titleBlockH + 4 + 14 + 8;

  // Clamp card horizontally so it stays within the viewport
  const cardX = Math.max(4, Math.min(x - SUPER_CARD_W / 2, width - SUPER_CARD_W - 4));
  const cardY = stemEnd + MARKER_R + 5;

  const date = formatTimelineDate(event.year, event.month, event.day);

  return (
    <g
      className="cursor-pointer"
      onClick={() => onSelect(event.id)}
      role="button"
      aria-label={`${event.title} — ${date}`}
    >
      <title>{`${event.title} — ${date}`}</title>

      {/* Stem from axis down to marker */}
      <line
        x1={x} y1={axisY}
        x2={x} y2={stemEnd}
        stroke={color}
        strokeWidth={1.5}
        strokeOpacity={0.4}
      />

      {/* Axis tick dot */}
      <circle cx={x} cy={axisY} r={3} fill={color} opacity={0.8} />

      {/* Marker circle at stem end */}
      <circle cx={x} cy={stemEnd} r={MARKER_R} fill={color} stroke="white" strokeWidth={1.5} />

      {/* Card background */}
      <rect
        x={cardX}
        y={cardY}
        width={SUPER_CARD_W}
        height={cardH}
        rx={CARD_R}
        fill="white"
        stroke={color}
        strokeWidth={1}
        strokeOpacity={0.3}
        style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.10))' }}
      />

      {/* Hit area covering card */}
      <rect x={cardX} y={cardY} width={SUPER_CARD_W} height={cardH} fill="transparent" />

      {/* Title — one <text> per wrapped line */}
      {titleLines.map((line, i) => (
        <text
          key={i}
          x={cardX + PAD}
          y={cardY + 12 + (i + 1) * LINE_H}
          fontSize={12}
          fontWeight="600"
          fill="#111827"
          fontFamily="ui-sans-serif, sans-serif"
        >
          {line}
        </text>
      ))}

      {/* Date */}
      <text
        x={cardX + PAD}
        y={cardY + 12 + titleBlockH + 4 + 14}
        fontSize={11}
        fill={color}
        fontFamily="ui-sans-serif, sans-serif"
      >
        {date}
      </text>
    </g>
  );
}
