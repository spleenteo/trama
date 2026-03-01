'use client';

import { useState } from 'react';
import type { ContextCard } from '@/lib/types';
import TimelineCard from '@/components/home/TimelineCard';
import HomeTimelineView from '@/components/home/HomeTimelineView';

interface Props {
  allContexts: ContextCard[];
}

type ViewMode = 'cards' | 'timeline';

export default function HomeView({ allContexts }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  if (allContexts.length === 0) {
    return (
      <p className="text-stone-500 text-center py-20">
        Nessuna timeline trovata. Crea dei Context radice su DatoCMS.
      </p>
    );
  }

  return (
    <>
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm font-semibold uppercase tracking-widest text-stone-400">
          Timeline ({allContexts.length})
        </p>

        {/* Toggle */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'cards'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Card
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'timeline'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allContexts.map((ctx) => (
            <TimelineCard key={ctx.id} context={ctx} />
          ))}
        </div>
      ) : (
        <HomeTimelineView contexts={allContexts} />
      )}
    </>
  );
}
