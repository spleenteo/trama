import type { ChildEvent, NodeSummary, NodeTree } from '@/lib/types';

/**
 * Build ChildEvent[] from promoted events fetched by ID,
 * resolving sourceContextId and sourceContextColor from the tree's parentMap.
 */
export function buildChildEvents(
  promotedEvents: NodeSummary[],
  parentMap: Map<string, NodeTree>,
): ChildEvent[] {
  return promotedEvents.map((ev) => {
    const parent = parentMap.get(ev.id);
    return {
      ...ev,
      sourceContextId: parent?.id ?? '',
      sourceContextColor: parent?.color?.hex ?? null,
    };
  });
}
