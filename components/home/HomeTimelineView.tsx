'use client';

import type { NodeCard, NodeTree, ChildEvent } from '@/lib/types';
import TimelineCanvas from '@/components/timeline/TimelineCanvas';

interface Props {
  nodes: NodeCard[];
  childEvents: ChildEvent[];
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

  if (ends.length > 0) {
    return { start: r.year, end: Math.max(...ends) };
  }

  // Fallback: use max of children's start years
  const childYears = r.children.map((c) => c.year);
  if (childYears.length > 0) {
    return { start: r.year, end: Math.max(...childYears) };
  }

  return { start: r.year, end: null };
}

function buildUniverseContext(roots: NodeCard[]): NodeTree {
  const ranges = roots.map((r) => deriveRange(r));
  const starts = ranges.map((r) => r.start);
  const ends = ranges.map((r) => r.end).filter((y): y is number => y != null);
  const minStart = starts.length > 0 ? Math.min(...starts) : 0;
  const maxEnd = ends.length > 0 ? Math.max(...ends) : null;

  return {
    id: 'universe',
    title: 'Trama',
    slug: 'universe',
    color: null,
    year: minStart,
    endYear: maxEnd,
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
        children: r.children.map((c) => ({
          id: c.id,
          title: c.title,
          slug: c.slug,
          color: c.color,
          year: c.year,
          endYear: c.endYear,
          visibility: c.visibility,
          eventType: c.eventType,
          description: null,
          featuredImage: null,
          children: [],
        })),
      };
    }),
  };
}

export default function HomeTimelineView({ nodes, childEvents }: Props) {
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
