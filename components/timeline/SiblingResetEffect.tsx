'use client';

import { useEffect } from 'react';
import { useTimelineStore } from '@/lib/store';

/** Clears visible siblings when the active slug changes (navigation) */
export default function SiblingResetEffect({ slug }: { slug: string }) {
  const resetHiddenSiblings = useTimelineStore((s) => s.resetHiddenSiblings);

  useEffect(() => {
    resetHiddenSiblings();
  }, [slug, resetHiddenSiblings]);

  return null;
}
