import { notFound } from 'next/navigation';
import { performRequest } from '@/lib/datocms/client';
import {
  CONTEXT_BY_SLUG_QUERY,
  CONTEXT_TREE_QUERY,
  EVENTS_BY_CONTEXT_QUERY,
} from '@/lib/datocms/queries';
import type { ContextTree as ContextTreeType, EventSummary } from '@/lib/types';
import TimelineCanvas from '@/components/timeline/TimelineCanvas';
import ContextTreeSidebar from '@/components/sidebar/ContextTree';
import EventDetailPanel from '@/components/detail/EventDetailPanel';

interface ContextResult {
  context: (ContextTreeType & {
    parent?: { id: string; slug: string } | null;
  }) | null;
}
interface TreeResult {
  context: ContextTreeType | null;
}
interface EventsResult {
  allEvents: EventSummary[];
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ event?: string }>;
}

export default async function TimelinePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { event: eventSlug } = await searchParams;

  const { context } = await performRequest<ContextResult>(CONTEXT_BY_SLUG_QUERY, { slug });
  if (!context) notFound();

  // Find the root context ID (walk up to parent)
  const rootId = context.parent?.id ?? context.id;

  const [{ context: rootTree }, { allEvents }] = await Promise.all([
    performRequest<TreeResult>(CONTEXT_TREE_QUERY, { rootId }),
    performRequest<EventsResult>(EVENTS_BY_CONTEXT_QUERY, { contextId: context.id }),
  ]);

  return (
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden">
      {/* Top nav */}
      <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-2 flex items-center gap-3 z-10">
        <a href="/" className="text-stone-400 hover:text-stone-700 text-sm transition-colors">
          ← Timeo
        </a>
        <span className="text-stone-200">/</span>
        {context.parent && (
          <>
            <a
              href={`/timeline/${context.parent.slug}`}
              className="text-sm text-stone-400 hover:text-stone-700 transition-colors truncate max-w-[120px]"
            >
              {rootTree?.title}
            </a>
            <span className="text-stone-200">/</span>
          </>
        )}
        <span className="text-sm font-medium text-stone-700 truncate">{context.title}</span>
      </header>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {rootTree && (
          <ContextTreeSidebar root={rootTree} activeSlug={slug} />
        )}

        {/* Canvas + detail panel */}
        <main className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
          <TimelineCanvas
            context={context}
            events={allEvents}
            initialEventSlug={eventSlug}
          />
          <EventDetailPanel />
        </main>
      </div>
    </div>
  );
}
