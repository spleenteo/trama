'use client';

import { useTimelineStore } from '@/lib/store';
import type { ContextTree as ContextTreeType } from '@/lib/types';
import ContextTreeItem from './ContextTreeItem';

interface Props {
  root: ContextTreeType;
  activeSlug: string;
}

export default function ContextTree({ root, activeSlug }: Props) {
  const sidebarOpen = useTimelineStore((s) => s.sidebarOpen);
  const toggleSidebar = useTimelineStore((s) => s.toggleSidebar);

  return (
    <div
      className={`flex flex-col h-full border-r border-stone-200 bg-white transition-all duration-200 ${
        sidebarOpen ? 'w-56' : 'w-10'
      }`}
    >
      {/* Toggle button */}
      <div className="flex items-center justify-end px-2 py-2 border-b border-stone-100">
        <button
          onClick={toggleSidebar}
          className="w-6 h-6 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
          title={sidebarOpen ? 'Chiudi sidebar' : 'Apri sidebar'}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
            {sidebarOpen ? (
              <path d="M11 3L6 8l5 5M4 3v10" />
            ) : (
              <path d="M5 3l5 5-5 5M12 3v10" />
            )}
          </svg>
        </button>
      </div>

      {/* Tree content */}
      {sidebarOpen && (
        <div className="flex-1 overflow-y-auto py-2 px-1">
          <ContextTreeItem node={root} activeSlug={activeSlug} depth={0} />
        </div>
      )}
    </div>
  );
}
