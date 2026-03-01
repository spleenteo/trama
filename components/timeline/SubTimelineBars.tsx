'use client';

import { useRouter } from 'next/navigation';
import type { ContextBase } from '@/lib/types';
import { yearToPixel } from '@/lib/timeline/scale';

interface ChildWithRange extends ContextBase {
  computedMin?: number | null;
  computedMax?: number | null;
}

interface Props {
  children: ChildWithRange[];
  viewportStart: number;
  pixelsPerYear: number;
  width: number;
  axisY: number;
}

const BAR_HEIGHT = 20;
const BAR_GAP = 8;

export default function SubTimelineBars({ children, viewportStart, pixelsPerYear, width, axisY }: Props) {
  const router = useRouter();

  const CURRENT_YEAR = new Date().getFullYear();

  // Show bar if it has a start. For the end: use computed/soft end, or current year
  // if the context is explicitly ongoing (isConcluded === false). Hide if concluded
  // but missing an end date (data error).
  const visible = children.filter((c) => {
    const start = c.computedMin ?? c.softStartYear;
    const end = c.computedMax ?? c.softEndYear ?? (c.isConcluded === false ? CURRENT_YEAR : null);
    return start != null && end != null;
  });

  if (visible.length === 0) return null;

  return (
    <g>
      {visible.map((child, i) => {
        const start = child.computedMin ?? child.softStartYear!;
        const end = child.computedMax ?? child.softEndYear ?? CURRENT_YEAR;
        const x1 = Math.max(0, yearToPixel(start, viewportStart, pixelsPerYear));
        const x2 = Math.min(width, yearToPixel(end, viewportStart, pixelsPerYear));
        const barWidth = Math.max(4, x2 - x1);
        // Bars grow upward: bar 1 is nearest to axis, bar N is furthest up
        const y = axisY - (i + 1) * (BAR_HEIGHT + BAR_GAP);
        const color = child.color?.hex ?? '#9ca3af';

        return (
          <g
            key={child.id}
            className="cursor-pointer"
            onClick={() => router.push(`/timeline/${child.slug}`)}
            role="button"
            aria-label={`Naviga in: ${child.title}`}
          >
            <title>{`${child.title} — clicca per navigare`}</title>
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
        );
      })}
    </g>
  );
}
