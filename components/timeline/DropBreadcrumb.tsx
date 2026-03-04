'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useDrag } from '@/lib/timeline/drag-context';

interface Props {
  parentId: string | null;
  parentSlug?: string;
  parentTitle?: string;
  currentTitle: string;
  rootTitle?: string;
}

export default function DropBreadcrumb({ parentId, parentSlug, parentTitle, currentTitle, rootTitle }: Props) {
  const { state: dragState, setDropTarget, endDrag, isDragging } = useDrag();
  const router = useRouter();
  const headerRef = useRef<HTMLElement>(null);

  const isDropTarget = isDragging && parentId != null && dragState.dropTargetId === parentId;

  useEffect(() => {
    if (!isDragging || !parentId) return;
    const el = headerRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const inside = e.clientX >= rect.left && e.clientX <= rect.right
        && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (inside) {
        setDropTarget(parentId);
      }
      // Don't clear — other targets in TimelineCanvas handle their own detection
    };

    const onUp = async () => {
      const result = endDrag();
      if (result && result.targetId === parentId) {
        try {
          const res = await fetch(`/api/nodes/${result.eventId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parent_id: result.targetId }),
          });
          if (res.ok) {
            await new Promise((r) => setTimeout(r, 1500));
            router.refresh();
          }
        } catch (err) {
          console.error('Move to parent failed:', err);
        }
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
  }, [isDragging, parentId, setDropTarget, endDrag, router]);

  return (
    <header
      ref={headerRef}
      className={`shrink-0 border-b px-4 py-2 flex items-center gap-3 z-10 transition-colors ${
        isDropTarget
          ? 'bg-blue-50 border-blue-300'
          : 'bg-white border-stone-200'
      }`}
      data-drop-id={parentId ?? undefined}
    >
      <a href="/" className="text-stone-400 hover:text-stone-700 text-sm transition-colors">
        ← Trama
      </a>
      <span className="text-stone-200">/</span>
      {parentSlug && (
        <>
          <a
            href={`/timeline/${parentSlug}`}
            className="text-sm text-stone-400 hover:text-stone-700 transition-colors truncate max-w-[120px]"
          >
            {rootTitle ?? parentTitle}
          </a>
          <span className="text-stone-200">/</span>
        </>
      )}
      <span className="text-sm font-medium text-stone-700 truncate">{currentTitle}</span>
      {isDropTarget && (
        <span className="ml-auto text-xs font-medium text-blue-500 animate-pulse">
          ↑ Sposta nel parent
        </span>
      )}
    </header>
  );
}
