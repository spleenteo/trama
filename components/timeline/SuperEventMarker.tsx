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

export const SUPER_CARD_W = 160;
export const STEM_BASE = 18;
export const LEVEL_STEP = 100;
export const MARKER_R = MARKER_RADIUS;

const CARD_R = 5;
const PAD_H = 9;
const PAD_V = 8;
const LINE_H = 15;
const MAX_LINES = 2;
const DATE_H = 13;
const BORDER_LEFT_W = 4; // thick left border for 'main'

// Split title into at most MAX_LINES lines; last line gets ellipsis if truncated
function clampLines(title: string, maxChars: number): string[] {
  const words = title.split(' ');
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
      if (lines.length === MAX_LINES - 1) break;
    }
  }
  if (current) lines.push(current);

  // If we broke early, check if there's remaining content
  const joined = lines.join(' ');
  if (joined.length < title.length) {
    const last = lines[lines.length - 1];
    // Trim last line to fit ellipsis
    lines[lines.length - 1] = last.slice(0, maxChars - 1) + '…';
  }

  return lines.slice(0, MAX_LINES);
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

  const CHARS_PER_LINE = Math.floor((SUPER_CARD_W - PAD_H * 2) / 7); // ~7px per char
  const titleLines = clampLines(event.title, CHARS_PER_LINE);

  // Card height: top-pad + title lines + gap + date row + bottom-pad
  const titleBlockH = titleLines.length * LINE_H;
  const cardH = PAD_V + titleBlockH + 4 + DATE_H + PAD_V;

  const cardX = Math.max(4, Math.min(x - SUPER_CARD_W / 2, width - SUPER_CARD_W - 4));
  const cardY = stemEnd + MARKER_R + 5;

  const startDate = formatTimelineDate(event.year, event.month, event.day);
  const endDate = event.toPresent
    ? 'oggi'
    : event.endYear != null
      ? formatTimelineDate(event.endYear, event.endMonth, event.endDay)
      : null;
  const dateText = endDate ? `${startDate} → ${endDate}` : startDate;

  const visibility = event.visibility;
  const isSuper = visibility === 'super';
  const isMain = visibility === 'main';

  // Styling per visibility
  const cardFill = isSuper ? color : 'white';
  const titleColor = isSuper ? 'white' : '#111827';
  const dateColor = isSuper ? 'rgba(255,255,255,0.8)' : color;

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
    if (didDrag.current) return;
    onSelect(event.id);
  }, [event.id, onSelect]);

  const isDragging = dragState.draggingEventId === event.id;
  const isDropTarget = dragState.draggingEventId != null
    && dragState.draggingEventId !== event.id
    && dragState.dropTargetId === event.id;

  // Stroke/shadow for non-super cards
  const strokeColor = isDropTarget ? '#3b82f6' : color;
  const strokeWidth = isDropTarget ? 2.5 : isMain ? 0 : (isHovered ? 1.5 : 1);
  const strokeOpacity = isDropTarget ? 1 : isHovered ? 0.7 : 0.3;

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
      aria-label={`${event.title} — ${dateText}`}
      style={{ pointerEvents: 'auto', opacity: isDragging ? 0.4 : 1 }}
      data-drop-id={event.id}
    >
      <title>{`${event.title} — ${dateText}`}</title>

      {/* Marker circle */}
      <circle cx={x} cy={stemEnd} r={MARKER_R} fill={color} stroke="white" strokeWidth={1.5} />

      {/* Drop highlight: blue overlay when drop target */}
      {isDropTarget && (
        <rect
          x={cardX} y={cardY}
          width={SUPER_CARD_W} height={cardH}
          rx={CARD_R}
          fill="#dbeafe"
          stroke="#3b82f6"
          strokeWidth={2.5}
          style={{ filter: 'drop-shadow(0 0 6px rgba(59,130,246,0.4))' }}
        />
      )}

      {/* Card background */}
      {!isDropTarget && (
        <rect
          x={cardX} y={cardY}
          width={SUPER_CARD_W} height={cardH}
          rx={CARD_R}
          fill={cardFill}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeOpacity={strokeOpacity}
          style={{
            filter: isHovered
              ? 'drop-shadow(0 3px 8px rgba(0,0,0,0.18))'
              : 'drop-shadow(0 1px 3px rgba(0,0,0,0.10))',
          }}
        />
      )}

      {/* Main: thick colored left border */}
      {isMain && !isDropTarget && (
        <rect
          x={cardX}
          y={cardY}
          width={BORDER_LEFT_W}
          height={cardH}
          rx={CARD_R}
          fill={color}
        />
      )}

      {/* Hit area */}
      <rect x={cardX} y={cardY} width={SUPER_CARD_W} height={cardH} fill="transparent" />

      {/* Title lines */}
      {titleLines.map((line, i) => (
        <text
          key={i}
          x={cardX + PAD_H + (isMain && !isDropTarget ? BORDER_LEFT_W + 2 : 0)}
          y={cardY + PAD_V + (i + 1) * LINE_H - 2}
          fontSize={12}
          fontWeight="600"
          fill={isDropTarget ? '#1e40af' : titleColor}
          fontFamily="ui-sans-serif, sans-serif"
          style={{ pointerEvents: 'none' }}
        >
          {line}
        </text>
      ))}

      {/* Date row */}
      <text
        x={cardX + PAD_H + (isMain && !isDropTarget ? BORDER_LEFT_W + 2 : 0)}
        y={cardY + PAD_V + titleBlockH + 4 + DATE_H - 2}
        fontSize={10}
        fill={isDropTarget ? '#3b82f6' : dateColor}
        fontFamily="ui-sans-serif, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {dateText}
      </text>
    </g>
  );
}
