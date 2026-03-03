import { notFound } from 'next/navigation';
import { performRequest } from '@/lib/datocms/client';
import {
  NODE_BY_SLUG_QUERY,
  NODE_TREE_QUERY,
  CHILD_NODES_QUERY,
  PROMOTED_EVENTS_QUERY,
} from '@/lib/datocms/queries';
import type { NodeTree as NodeTreeType, NodeSummary } from '@/lib/types';
import { buildChildEvents } from '@/lib/timeline/child-events';
import { getSiblings, findNodeInTree, computeTreeRanges, collectPromotedNodeIds, buildParentMap } from '@/lib/timeline/tree-utils';
import TimelineCanvas from '@/components/timeline/TimelineCanvas';
import NodeTreeSidebar from '@/components/sidebar/NodeTree';
import EventDetailPanel from '@/components/detail/EventDetailPanel';
import SiblingResetEffect from '@/components/timeline/SiblingResetEffect';

interface ChildWithGrandchildren {
  id: string;
  children?: { id: string }[];
}

interface NodeResult {
  node: (NodeTreeType & {
    parent?: { id: string; slug: string } | null;
    children: ChildWithGrandchildren[];
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

  // Separate sub-contexts (children that have their own children) from leaf events
  const subContextIds = new Set(
    node.children
      .filter((c) => (c.children?.length ?? 0) > 0)
      .map((c) => c.id)
  );
  const leafEvents = allNodes.filter((n) => !subContextIds.has(n.id));

  // Collect promoted events from the full tree (super at any depth, main at depth 1)
  const { superIds, mainIds } = rootTree
    ? collectPromotedNodeIds(rootTree, node.id)
    : { superIds: [], mainIds: [] };
  const promotedIds = [...superIds, ...mainIds];

  let childEvents: import('@/lib/types').ChildEvent[] = [];
  if (promotedIds.length > 0 && rootTree) {
    const { allNodes: promotedEvents } = await performRequest<ChildNodesResult>(
      PROMOTED_EVENTS_QUERY,
      { ids: promotedIds },
    );
    const parentMap = buildParentMap(rootTree);
    childEvents = buildChildEvents(promotedEvents, parentMap);
  }

  // Compute ranges from the full tree so children without endYear get computed ranges
  const rangeMap = rootTree ? computeTreeRanges(rootTree) : new Map();

  // Enrich context node: use rootTree's version of current node's children (has full tree depth)
  // and attach computedMin/computedMax from rangeMap
  const treeNode = rootTree ? findNodeInTree(rootTree, node.id) : null;
  const enrichedContext = {
    ...node,
    children: (treeNode?.children ?? node.children).filter((c) => subContextIds.has(c.id)).map((c) => {
      const range = rangeMap.get(c.id);
      return {
        ...c,
        computedMin: range?.computedStart ?? undefined,
        computedMax: range?.computedEnd ?? undefined,
      };
    }),
  };

  // Compute siblings (other children of the same parent) for ghost bars
  const siblings = rootTree ? getSiblings(rootTree, node.id) : [];
  const siblingIds = new Set(siblings.map((s) => s.id));

  return (
    <div className="flex flex-col h-screen bg-stone-50 overflow-hidden">
      {/* Top nav */}
      <header className="shrink-0 border-b border-stone-200 bg-white px-4 py-2 flex items-center gap-3 z-10">
        <a href="/" className="text-stone-400 hover:text-stone-700 text-sm transition-colors">
          ← Trama
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
          <NodeTreeSidebar root={rootTree} activeSlug={slug} siblingIds={siblingIds} />
        )}

        {/* Canvas + detail panel */}
        <main className="relative flex-1 min-w-0 flex flex-col overflow-hidden">
          <TimelineCanvas
            context={enrichedContext}
            events={leafEvents}
            childEvents={childEvents}
            initialEventSlug={eventSlug}
            siblings={siblings}
          />
          <EventDetailPanel />
          <SiblingResetEffect slug={slug} />
        </main>
      </div>
    </div>
  );
}
