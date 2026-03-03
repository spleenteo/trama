'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NodeTree } from '@/lib/types';
import { formatYearRange } from '@/lib/timeline/date-utils';
import { getAccentColor } from '@/lib/utils/color';
import { useTimelineStore } from '@/lib/store';

interface Props {
  node: NodeTree;
  activeSlug: string;
  depth?: number;
}

export default function NodeTreeItem({ node, activeSlug, depth = 0 }: Props) {
  const router = useRouter();
  const setSelectedEvent = useTimelineStore((s) => s.setSelectedEvent);
  const [expanded, setExpanded] = useState(depth === 0 || node.slug === activeSlug);
  const hasChildren = node.children.some((c) => c.children.length > 0);
  const isActive = node.slug === activeSlug;
  const accentColor = getAccentColor(node.color);

  const rangeLabel = formatYearRange(node.year, node.endYear);

  return (
    <div>
      <div
        className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? 'bg-stone-100 text-stone-900'
            : 'text-stone-600 hover:bg-stone-50 hover:text-stone-800'
        }`}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
        onClick={() => router.push(`/timeline/${node.slug}`)}
      >
        {/* Expand/collapse arrow */}
        {hasChildren ? (
          <button
            className="shrink-0 w-4 h-4 flex items-center justify-center text-stone-400 hover:text-stone-600"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((v) => !v);
            }}
            aria-label={expanded ? 'Collassa' : 'Espandi'}
          >
            <svg
              viewBox="0 0 10 10"
              className={`w-2.5 h-2.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="currentColor"
            >
              <path d="M3 2l4 3-4 3V2z" />
            </svg>
          </button>
        ) : (
          <span className="shrink-0 w-4" />
        )}

        {/* Color dot */}
        <span
          className="shrink-0 w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />

        {/* Title + range */}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-medium leading-none truncate block">{node.title}</span>
          {rangeLabel && (
            <span className="text-[10px] text-stone-400 font-mono leading-none block mt-0.5">
              {rangeLabel}
            </span>
          )}
        </div>

        {/* Info button — opens detail panel without navigating */}
        <button
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded text-stone-300 opacity-0 group-hover:opacity-100 hover:text-stone-600 hover:bg-stone-100 transition-all"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedEvent(node.id);
          }}
          aria-label={`Info: ${node.title}`}
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1Zm0 2.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2ZM7 7h2v5H7V7Z" />
          </svg>
        </button>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children
            .filter((child) => child.children.length > 0)
            .map((child) => (
              <NodeTreeItem
                key={child.id}
                node={child}
                activeSlug={activeSlug}
                depth={depth + 1}
              />
            ))}
        </div>
      )}
    </div>
  );
}
