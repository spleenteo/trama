'use client';

import { useRouter } from 'next/navigation';
import { useTimelineStore } from '@/lib/store';
import { formatTimelineDate } from '@/lib/timeline/date-utils';

interface RelatedNode {
  id: string;
  title: string;
  slug: string;
  year: number;
  month: number | null;
  parent: { id: string; title: string; slug: string } | null;
}

interface Props {
  related: RelatedNode[];
  currentParentId: string | null;
}

export default function RelatedNodesList({ related, currentParentId }: Props) {
  const router = useRouter();
  const setSelectedEvent = useTimelineStore((s) => s.setSelectedEvent);

  if (related.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-widest text-stone-400 mb-2">
        Nodi correlati
      </h3>
      <ul className="space-y-1">
        {related.map((node) => {
          const sameParent = node.parent?.id === currentParentId;
          return (
            <li key={node.id}>
              <button
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-stone-100 transition-colors group"
                onClick={() => {
                  if (sameParent) {
                    setSelectedEvent(node.id);
                  } else if (node.parent) {
                    router.push(`/timeline/${node.parent.slug}?event=${node.slug}`);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-medium text-stone-800 group-hover:text-stone-900 leading-snug">
                    {node.title}
                  </span>
                  {!sameParent && (
                    <span className="shrink-0 text-[10px] text-stone-400 mt-0.5">↗</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-stone-400 font-mono">
                    {formatTimelineDate(node.year, node.month)}
                  </span>
                  {!sameParent && node.parent && (
                    <span className="text-[10px] text-stone-400 truncate">
                      {node.parent.title}
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
