'use client';

import type { ContextCard, ContextTree } from '@/lib/types';
import { extractChildEvents } from '@/lib/timeline/child-events';
import TimelineCanvas from '@/components/timeline/TimelineCanvas';

interface Props {
  contexts: ContextCard[];
}

// Derive a usable [start, end] range for a root context.
// If the root has no soft dates, fall back to the min/max of its sub-contexts.
function deriveRange(r: ContextCard): { start: number | null; end: number | null } {
  const CURRENT_YEAR = new Date().getFullYear();

  if (r.softStartYear != null) {
    return {
      start: r.softStartYear,
      end: r.softEndYear ?? (r.isConcluded === false ? CURRENT_YEAR : null),
    };
  }

  const starts = r.children
    .map((c) => c.softStartYear)
    .filter((y): y is number => y != null);

  const ends = r.children
    .map((c) => c.softEndYear ?? (c.isConcluded === false ? CURRENT_YEAR : null))
    .filter((y): y is number => y != null);

  return {
    start: starts.length > 0 ? Math.min(...starts) : null,
    end: ends.length > 0 ? Math.max(...ends) : (r.isConcluded === false ? CURRENT_YEAR : null),
  };
}

function buildUniverseContext(roots: ContextCard[]): ContextTree {
  return {
    id: 'universe',
    title: 'Timeo',
    slug: 'universe',
    color: null,
    softStartYear: null,
    softEndYear: null,
    isConcluded: false,
    description: null,
    featuredImage: null,
    children: roots.map((r) => {
      const { start, end } = deriveRange(r);
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        color: r.color,
        softStartYear: start,
        softEndYear: end,
        isConcluded: r.isConcluded,
        description: null,
        featuredImage: null,
        children: [],
      };
    }),
  };
}

export default function HomeTimelineView({ contexts }: Props) {
  const childEvents = extractChildEvents(contexts);

  return (
    <div className="h-[60vh] min-h-[400px] border border-stone-200 rounded-2xl overflow-hidden bg-white flex flex-col">
      <TimelineCanvas
        context={buildUniverseContext(contexts)}
        events={[]}
        childEvents={childEvents}
        showContextBar={false}
      />
    </div>
  );
}
