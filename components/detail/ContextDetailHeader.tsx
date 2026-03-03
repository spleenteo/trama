import type { NodeTree } from '@/lib/types';
import { formatTimelineDate } from '@/lib/timeline/date-utils';
import { getAccentColor } from '@/lib/utils/color';

interface Props {
  context: NodeTree;
  eventsMinYear?: number | null;
  eventsMaxYear?: number | null;
}

export default function ContextDetailHeader({ context, eventsMinYear, eventsMaxYear }: Props) {
  const { title, color, year, endYear } = context;
  const accentColor = getAccentColor(color);

  const startYear = eventsMinYear ?? year;
  const computedEnd = eventsMaxYear ?? endYear;

  const rangeLabel = (() => {
    if (!startYear) return null;
    const startStr = formatTimelineDate(startYear);
    if (computedEnd && computedEnd !== startYear) return `${startStr} — ${formatTimelineDate(computedEnd)}`;
    return startStr;
  })();

  return (
    <div
      className="flex items-center gap-3 px-5 py-3 border-b border-stone-200 bg-white"
      style={{ borderLeftColor: accentColor, borderLeftWidth: 3 }}
    >
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: accentColor }}
      />
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-stone-900 truncate">{title}</h1>
        {rangeLabel && (
          <p className="text-xs text-stone-400 font-mono mt-0.5">{rangeLabel}</p>
        )}
      </div>
    </div>
  );
}
