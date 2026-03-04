'use client';

import { DragProvider } from '@/lib/timeline/drag-context';

export default function TimelinePageShell({ children }: { children: React.ReactNode }) {
  return <DragProvider>{children}</DragProvider>;
}
