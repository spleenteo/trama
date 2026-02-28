import type { ContextTree } from '@/lib/types';
import { formatTimelineDate } from '@/lib/timeline/date-utils';

interface Props {
  context: ContextTree;
  eventsMinYear?: number | null;
  eventsMaxYear?: number | null;
}

export default function ContextDetailHeader({ context, eventsMinYear, eventsMaxYear }: Props) {
  const { title, color, softStartYear, softEndYear, isConcluded } = context;
  const accentColor = color?.hex ?? '#6b7280';

  const startYear = eventsMinYear ?? softStartYear;
  const endYear = eventsMaxYear ?? softEndYear;
  const currentYear = new Date().getFullYear();

  const rangeLabel = (() => {
    if (!startYear) return null;
    const startStr = formatTimelineDate(startYear);
    if (isConcluded && endYear) return `${startStr} — ${formatTimelineDate(endYear)}`;
    if (!isConcluded) return `${startStr} — oggi (${currentYear})`;
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
      <span
        className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
          isConcluded
            ? 'bg-stone-100 text-stone-500'
            : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        {isConcluded ? 'conclusa' : 'in corso'}
      </span>
    </div>
  );
}
