'use client';

import { useRouter } from 'next/navigation';
import type { NodeBase } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';

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
}

const BAR_HEIGHT = 20;
const BAR_GAP = 16;        // gap between consecutive bars
const AXIS_CLEARANCE = 40; // gap from axis line to bottom of first (lowest) bar
const INFO_SIZE = 16;

export default function SubTimelineBars({ children, viewportStart, pixelsPerYear, width, axisY, onSelectInfo }: Props) {
  const router = useRouter();

  // Show bar only if it has a real range (computedMin/Max or year/endYear)
  const visible = children.filter((c) => {
    const start = c.computedMin ?? c.year;
    const end = c.computedMax ?? c.endYear ?? null;
    return start != null && end != null;
  });

  if (visible.length === 0) return null;

  return (
    <g>
      {visible.map((child, i) => {
        const start = child.computedMin ?? child.year;
        const end = child.computedMax ?? child.endYear ?? child.year;
        const x1 = Math.max(0, yearToPixel(start, viewportStart, pixelsPerYear));
        const x2 = Math.min(width, yearToPixel(end, viewportStart, pixelsPerYear));
        const barWidth = Math.max(4, x2 - x1);
        // Bars grow upward: bar 0 is lowest (nearest to axis), bar N is furthest up.
        // AXIS_CLEARANCE keeps the first bar above the year labels.
        const y = axisY - AXIS_CLEARANCE - BAR_HEIGHT - i * (BAR_HEIGHT + BAR_GAP);
        const color = child.color?.hex ?? '#9ca3af';
        const isNavigable = (child.children?.length ?? 0) > 0;
        const infoX = x1 - INFO_SIZE - 4;
        const infoY = y + (BAR_HEIGHT - INFO_SIZE) / 2;

        return (
          <g key={child.id}>
            {/* Info icon — positioned to the left of the bar */}
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

            {/* Bar — click navigates only if the node has children (is a real sub-timeline) */}
            <g
              className={isNavigable ? 'cursor-pointer' : undefined}
              onClick={isNavigable ? () => router.push(`/timeline/${child.slug}`) : undefined}
              role={isNavigable ? 'button' : undefined}
              aria-label={isNavigable ? `Naviga in: ${child.title}` : child.title}
              style={{ pointerEvents: 'auto' }}
            >
              {isNavigable && <title>{`${child.title} — clicca per navigare`}</title>}
              {/* Hit area */}
              <rect x={x1} y={y - 4} width={barWidth} height={BAR_HEIGHT + 8} fill="transparent" />
              {/* Bar */}
              <rect
                x={x1} y={y}
                width={barWidth} height={BAR_HEIGHT}
                rx={BAR_HEIGHT / 2}
                fill={color}
                opacity={0.65}
              />
              {/* Label — only if bar is wide enough */}
              {barWidth > 60 && (
                <text
                  x={x1 + 12}
                  y={y + BAR_HEIGHT / 2 + 5}
                  fontSize={13}
                  fill="white"
                  fontWeight="600"
                  fontFamily="ui-sans-serif, sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {child.title.length > 28 ? child.title.slice(0, 26) + '…' : child.title}
                </text>
              )}
            </g>
          </g>
        );
      })}
    </g>
  );
}
