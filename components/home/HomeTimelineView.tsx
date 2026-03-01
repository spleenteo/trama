'use client';

import type { ContextCard, ContextTree } from '@/lib/types';
import { extractChildEvents } from '@/lib/timeline/child-events';
import TimelineCanvas from '@/components/timeline/TimelineCanvas';

interface Props {
  contexts: ContextCard[];
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
    children: roots.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      color: r.color,
      softStartYear: r.softStartYear,
      softEndYear: r.softEndYear,
      isConcluded: r.isConcluded,
      description: null,
      featuredImage: null,
      children: [],
    })),
  };
}

export default function HomeTimelineView({ contexts }: Props) {
  const childEvents = extractChildEvents(contexts);

  return (
    <div className="h-[60vh] min-h-[400px] border border-stone-200 rounded-2xl overflow-hidden bg-white">
      <TimelineCanvas
        context={buildUniverseContext(contexts)}
        events={[]}
        childEvents={childEvents}
        showContextBar={false}
      />
    </div>
  );
}
