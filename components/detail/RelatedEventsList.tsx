'use client';

import { useRouter } from 'next/navigation';
import { useTimelineStore } from '@/lib/store';
import { formatTimelineDate } from '@/lib/timeline/date-utils';

interface RelatedEvent {
  id: string;
  title: string;
  slug: string;
  year: number;
  month: number | null;
  context: { id: string; title: string; slug: string };
}

interface Props {
  related: RelatedEvent[];
  currentContextId: string;
}

export default function RelatedEventsList({ related, currentContextId }: Props) {
  const router = useRouter();
  const setSelectedEvent = useTimelineStore((s) => s.setSelectedEvent);

  if (related.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
        Eventi correlati
      </h3>
      <ul className="space-y-1">
        {related.map((ev) => {
          const sameContext = ev.context.id === currentContextId;
          return (
            <li key={ev.id}>
              <button
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors group"
                onClick={() => {
                  if (sameContext) {
                    setSelectedEvent(ev.id);
                  } else {
                    router.push(`/timeline/${ev.context.slug}?event=${ev.slug}`);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-stone-800 group-hover:text-stone-900 leading-snug">
                    {ev.title}
                  </span>
                  {!sameContext && (
                    <span className="shrink-0 text-[10px] text-stone-400 mt-0.5">↗</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-stone-400 font-mono">
                    {formatTimelineDate(ev.year, ev.month)}
                  </span>
                  {!sameContext && (
                    <span className="text-[10px] text-stone-400 truncate">
                      {ev.context.title}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
