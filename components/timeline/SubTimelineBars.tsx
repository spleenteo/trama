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
}

const BAR_HEIGHT = 14;
const BAR_GAP = 6;
const SUB_Y_OFFSET = 72; // below the axis (AXIS_Y=48 + some space)

export default function SubTimelineBars({ children, viewportStart, pixelsPerYear, width }: Props) {
  const router = useRouter();

  const visible = children.filter((c) => {
    const start = c.computedMin ?? c.softStartYear;
    const end = c.computedMax ?? c.softEndYear;
    return start != null || end != null;
  });

  if (visible.length === 0) return null;

  return (
    <g>
      {visible.map((child, i) => {
        const start = child.computedMin ?? child.softStartYear!;
        const end = child.computedMax ?? child.softEndYear ?? new Date().getFullYear();
        const x1 = Math.max(0, yearToPixel(start, viewportStart, pixelsPerYear));
        const x2 = Math.min(width, yearToPixel(end, viewportStart, pixelsPerYear));
        const barWidth = Math.max(4, x2 - x1);
        const y = SUB_Y_OFFSET + i * (BAR_HEIGHT + BAR_GAP);
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
            {barWidth > 40 && (
              <text
                x={x1 + 6}
                y={y + BAR_HEIGHT / 2 + 4}
                fontSize={9}
                fill="white"
                fontWeight="600"
                fontFamily="ui-sans-serif, sans-serif"
                style={{ pointerEvents: 'none' }}
              >
                {child.title.length > 22 ? child.title.slice(0, 20) + '…' : child.title}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}
