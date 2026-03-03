'use client';

import { useEffect } from 'react';
import { useTimelineStore } from '@/lib/store';

/** Clears visible siblings when the active slug changes (navigation) */
export default function SiblingResetEffect({ slug }: { slug: string }) {
  const clearVisibleSiblings = useTimelineStore((s) => s.clearVisibleSiblings);

  useEffect(() => {
    clearVisibleSiblings();
  }, [slug, clearVisibleSiblings]);

  return null;
}
