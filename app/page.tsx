import { performRequest } from '@/lib/datocms/client';
import { ALL_ROOT_NODES_QUERY, NODE_TREE_QUERY, PROMOTED_EVENTS_QUERY } from '@/lib/datocms/queries';
import type { NodeCard, NodeTree, NodeSummary, ChildEvent } from '@/lib/types';
import { buildChildEvents } from '@/lib/timeline/child-events';
import { collectPromotedNodeIds, buildParentMap } from '@/lib/timeline/tree-utils';
import HomeView from '@/components/home/HomeView';

interface QueryResult {
  allNodes: NodeCard[];
}
interface TreeResult {
  node: NodeTree | null;
}
interface PromotedResult {
  allNodes: NodeSummary[];
}

export default async function HomePage() {
  const { allNodes } = await performRequest<QueryResult>(ALL_ROOT_NODES_QUERY);

  // Fetch full tree for each root in parallel to collect promoted (super) events
  const trees = await Promise.all(
    allNodes.map((root) =>
      performRequest<TreeResult>(NODE_TREE_QUERY, { rootId: root.id })
    )
  );

  // Collect all super event IDs across all trees
  const allSuperIds: string[] = [];
  const allParentMaps: Map<string, NodeTree>[] = [];
  for (const { node: tree } of trees) {
    if (!tree) continue;
    const { superIds } = collectPromotedNodeIds(tree, tree.id);
    allSuperIds.push(...superIds);
    allParentMaps.push(buildParentMap(tree));
  }

  // Batch fetch promoted events and build ChildEvent[]
  let childEvents: ChildEvent[] = [];
  if (allSuperIds.length > 0) {
    const { allNodes: promotedEvents } = await performRequest<PromotedResult>(
      PROMOTED_EVENTS_QUERY,
      { ids: allSuperIds },
    );
    // Merge all parent maps into one for color resolution
    const mergedParentMap = new Map<string, NodeTree>();
    for (const pm of allParentMaps) {
      for (const [k, v] of pm) mergedParentMap.set(k, v);
    }
    childEvents = buildChildEvents(promotedEvents, mergedParentMap);
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-baseline gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Trama</h1>
          <span className="text-sm text-stone-400">esplora processi attraverso il tempo</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-10">
        <HomeView allNodes={allNodes} childEvents={childEvents} />
      </div>
    </main>
  );
}
