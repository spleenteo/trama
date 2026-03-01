import type { ChildEvent, EventSummary } from '@/lib/types';

interface ContextWithRefEvents {
  id: string;
  color?: { hex: string } | null;
  _allReferencingEvents?: EventSummary[];
}

export function extractChildEvents(children: ContextWithRefEvents[]): ChildEvent[] {
  return children.flatMap((ctx) =>
    (ctx._allReferencingEvents ?? []).map((ev) => ({
      ...ev,
      sourceContextId: ctx.id,
      sourceContextColor: ctx.color?.hex ?? null,
    }))
  );
}
