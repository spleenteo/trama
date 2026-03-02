import type { ChildEvent, NodeSummary } from '@/lib/types';

interface NodeWithRefNodes {
  id: string;
  color?: { hex: string } | null;
  _allReferencingNodes?: NodeSummary[];
}

export function extractChildEvents(children: NodeWithRefNodes[]): ChildEvent[] {
  return children.flatMap((ctx) =>
    (ctx._allReferencingNodes ?? []).map((ev) => ({
      ...ev,
      sourceContextId: ctx.id,
      sourceContextColor: ctx.color?.hex ?? null,
    }))
  );
}
