import { notFound } from 'next/navigation';
import { performRequest } from '@/lib/datocms/client';
import {
  NODE_BY_SLUG_QUERY,
  NODE_TREE_QUERY,
  CHILD_NODES_QUERY,
} from '@/lib/datocms/queries';
import type { NodeTree as NodeTreeType, NodeSummary } from '@/lib/types';
import { extractChildEvents } from '@/lib/timeline/child-events';
import TimelineCanvas from '@/components/timeline/TimelineCanvas';
import NodeTreeSidebar from '@/components/sidebar/NodeTree';
import EventDetailPanel from '@/components/detail/EventDetailPanel';

interface NodeResult {
  node: (NodeTreeType & {
    parent?: { id: string; slug: string } | null;
  }) | null;
}
interface TreeResult {
  node: NodeTreeType | null;
}
interface ChildNodesResult {
  allNodes: NodeSummary[];
}

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ event?: string }>;
}

export default async function TimelinePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { event: eventSlug } = await searchParams;

  const { node } = await performRequest<NodeResult>(NODE_BY_SLUG_QUERY, { slug });
  if (!node) notFound();

  // Find the root node ID (walk up to parent)
  const rootId = node.parent?.id ?? node.id;

  const [{ node: rootTree }, { allNodes }] = await Promise.all([
    performRequest<TreeResult>(NODE_TREE_QUERY, { rootId }),
    performRequest<ChildNodesResult>(CHILD_NODES_QUERY, { parentId: node.id }),
  ]);

  const childEvents = extractChildEvents(node.children);

  return (
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden">
      {/* Top nav */}
      <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-2 flex items-center gap-3 z-10">
        <a href="/" className="text-stone-400 hover:text-stone-700 text-sm transition-colors">
          ← Timeo
        </a>
        <span className="text-stone-200">/</span>
        {node.parent && (
          <>
            <a
              href={`/timeline/${node.parent.slug}`}
              className="text-sm text-stone-400 hover:text-stone-700 transition-colors truncate max-w-[120px]"
            >
              {rootTree?.title}
            </a>
            <span className="text-stone-200">/</span>
          </>
        )}
        <span className="text-sm font-medium text-stone-700 truncate">{node.title}</span>
      </header>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        {rootTree && (
          <NodeTreeSidebar root={rootTree} activeSlug={slug} />
        )}

        {/* Canvas + detail panel */}
        <main className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
          <TimelineCanvas
            context={node}
            events={allNodes}
            childEvents={childEvents}
            initialEventSlug={eventSlug}
          />
          <EventDetailPanel />
        </main>
      </div>
    </div>
  );
}
