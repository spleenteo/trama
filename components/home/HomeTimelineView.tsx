'use client';

import type { NodeCard, NodeTree } from '@/lib/types';
import { extractChildEvents } from '@/lib/timeline/child-events';
import TimelineCanvas from '@/components/timeline/TimelineCanvas';

interface Props {
  nodes: NodeCard[];
}

// Derive a usable [start, end] range for a root node.
// If the root has no end date, fall back to the max of its sub-nodes.
function deriveRange(r: NodeCard): { start: number; end: number | null } {
  if (r.endYear != null) {
    return { start: r.year, end: r.endYear };
  }

  const ends = r.children
    .map((c) => c.endYear)
    .filter((y): y is number => y != null);

  return {
    start: r.year,
    end: ends.length > 0 ? Math.max(...ends) : null,
  };
}

function buildUniverseContext(roots: NodeCard[]): NodeTree {
  return {
    id: 'universe',
    title: 'Timeo',
    slug: 'universe',
    color: null,
    year: 0,
    endYear: null,
    visibility: 'super',
    eventType: 'event',
    description: null,
    featuredImage: null,
    children: roots.map((r) => {
      const { start, end } = deriveRange(r);
      return {
        id: r.id,
        title: r.title,
        slug: r.slug,
        color: r.color,
        year: start,
        endYear: end,
        visibility: r.visibility,
        eventType: r.eventType,
        description: null,
        featuredImage: null,
        children: [],
      };
    }),
  };
}

export default function HomeTimelineView({ nodes }: Props) {
  const childEvents = extractChildEvents(nodes);

  return (
    <div className="h-[60vh] min-h-[400px] border border-stone-200 rounded-2xl overflow-hidden bg-white flex flex-col">
      <TimelineCanvas
        context={buildUniverseContext(nodes)}
        events={[]}
        childEvents={childEvents}
        showContextBar={false}
      />
    </div>
  );
}
