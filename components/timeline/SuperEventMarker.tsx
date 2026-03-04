'use client';

import { useRef, useCallback } from 'react';
import type { NodeSummary } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';
import { eventToFractionalYear, formatTimelineDate } from '@/lib/timeline/date-utils';
import { DEFAULT_ACCENT } from '@/lib/utils/color';
import { MARKER_RADIUS } from '@/lib/timeline/constants';
import { useDrag } from '@/lib/timeline/drag-context';

const LONG_PRESS_MS = 500;

interface Props {
  event: NodeSummary;
  viewportStart: number;
  pixelsPerYear: number;
  axisY: number;
  width: number;
  level: number;
  color?: string;
  isHovered?: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export const SUPER_CARD_W = 170;
export const STEM_BASE = 18;
export const LEVEL_STEP = 100; // gap between levels (accommodates label row)
export const MARKER_R = MARKER_RADIUS;

const CARD_R = 6;
const PAD = 8;
const LINE_H = 16;
const CHARS_PER_LINE = 22;
const LABEL_H = 14; // height reserved for the event-type label row

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

function typeLabel(eventType: string): string {
  switch (eventType) {
    case 'key_moment': return '★ momento chiave';
    case 'incident':   return '◆ incidente';
    default:           return '· evento';
  }
}

function visibilityLabel(visibility: string): string | null {
  switch (visibility) {
    case 'super': return 'super';
    case 'main':  return 'main';
    default:      return null;
  }
}

export default function SuperEventMarker({
  event,
  viewportStart,
  pixelsPerYear,
  axisY,
  width,
  level,
  color: colorProp,
  isHovered,
  onSelect,
  onHover,
}: Props) {
  const frac = eventToFractionalYear(event);
  const x = yearToPixel(frac, viewportStart, pixelsPerYear);

  if (x < -(SUPER_CARD_W / 2 + 20) || x > width + SUPER_CARD_W / 2 + 20) return null;

  const color = colorProp ?? DEFAULT_ACCENT;
  const stemEnd = axisY + STEM_BASE + level * LEVEL_STEP;

  const titleLines = wrapText(event.title, CHARS_PER_LINE);
  const titleBlockH = titleLines.length * LINE_H;
  // card height: label-row(14) + top-pad(12) + title block + gap(4) + date(14) + bottom-pad(8)
  const cardH = LABEL_H + 12 + titleBlockH + 4 + 14 + 8;

  const cardX = Math.max(4, Math.min(x - SUPER_CARD_W / 2, width - SUPER_CARD_W - 4));
  const cardY = stemEnd + MARKER_R + 5;

  const date = formatTimelineDate(event.year, event.month, event.day);
  const label = typeLabel(event.eventType);

  const { state: dragState, startDrag } = useDrag();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didDrag = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    didDrag.current = false;
    longPressTimer.current = setTimeout(() => {
      didDrag.current = true;
      startDrag(event.id);
    }, LONG_PRESS_MS);
  }, [event.id, startDrag]);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (didDrag.current) return; // suppress click after drag
    onSelect(event.id);
  }, [event.id, onSelect]);

  const isDragging = dragState.draggingEventId === event.id;
  const isDropTarget = dragState.draggingEventId != null
    && dragState.draggingEventId !== event.id
    && dragState.dropTargetId === event.id;

  return (
    <g
      className={isDragging ? 'cursor-grabbing' : 'cursor-pointer'}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseEnter={() => onHover(event.id)}
      onMouseLeave={() => onHover(null)}
      role="button"
      aria-label={`${event.title} — ${date}`}
      style={{ pointerEvents: 'auto', opacity: isDragging ? 0.4 : 1 }}
      data-drop-id={event.id}
    >
      <title>{`${event.title} — ${date}`}</title>

      {/* Marker circle at stem end (above all stems — rendered in card layer) */}
      <circle cx={x} cy={stemEnd} r={MARKER_R} fill={color} stroke="white" strokeWidth={1.5} />

      {/* Card background */}
      <rect
        x={cardX}
        y={cardY}
        width={SUPER_CARD_W}
        height={cardH}
        rx={CARD_R}
        fill={isDropTarget ? '#dbeafe' : 'white'}
        stroke={isDropTarget ? '#3b82f6' : color}
        strokeWidth={isDropTarget ? 2.5 : isHovered ? 1.5 : 1}
        strokeOpacity={isDropTarget ? 1 : isHovered ? 0.7 : 0.3}
        style={{
          filter: isDropTarget
            ? 'drop-shadow(0 0 6px rgba(59,130,246,0.4))'
            : isHovered
              ? 'drop-shadow(0 3px 8px rgba(0,0,0,0.18))'
              : 'drop-shadow(0 1px 3px rgba(0,0,0,0.10))',
        }}
      />

      {/* Hit area covering card */}
      <rect x={cardX} y={cardY} width={SUPER_CARD_W} height={cardH} fill="transparent" />

      {/* Event type label */}
      <text
        x={cardX + PAD}
        y={cardY + LABEL_H - 2}
        fontSize={10}
        fill={color}
        opacity={0.75}
        fontFamily="ui-sans-serif, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {label}
      </text>

      {/* Visibility badge */}
      {visibilityLabel(event.visibility) && (
        <text
          x={cardX + SUPER_CARD_W - PAD}
          y={cardY + LABEL_H - 2}
          textAnchor="end"
          fontSize={9}
          fontWeight="600"
          fill={color}
          opacity={0.5}
          fontFamily="ui-monospace, monospace"
          style={{ pointerEvents: 'none' }}
        >
          {visibilityLabel(event.visibility)}
        </text>
      )}

      {/* Title — one <text> per wrapped line */}
      {titleLines.map((line, i) => (
        <text
          key={i}
          x={cardX + PAD}
          y={cardY + LABEL_H + 12 + (i + 1) * LINE_H}
          fontSize={12}
          fontWeight="600"
          fill="#111827"
          fontFamily="ui-sans-serif, sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {line}
        </text>
      ))}

      {/* Date */}
      <text
        x={cardX + PAD}
        y={cardY + LABEL_H + 12 + titleBlockH + 4 + 14}
        fontSize={11}
        fill={color}
        fontFamily="ui-sans-serif, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {date}
      </text>
    </g>
  );
}
