'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ContextTree } from '@/lib/types';
import { formatYearRange } from '@/lib/timeline/date-utils';
import { getAccentColor } from '@/lib/utils/color';

interface Props {
  node: ContextTree;
  activeSlug: string;
  depth?: number;
}

export default function ContextTreeItem({ node, activeSlug, depth = 0 }: Props) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(depth === 0 || node.slug === activeSlug);
  const hasChildren = node.children.length > 0;
  const isActive = node.slug === activeSlug;
  const accentColor = getAccentColor(node.color);

  const rangeLabel = formatYearRange(node.softStartYear, node.softEndYear, node.isConcluded);

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
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <ContextTreeItem
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
