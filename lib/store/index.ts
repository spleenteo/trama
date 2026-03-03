'use client';

import { create } from 'zustand';

interface TimelineStore {
  selectedEventId: string | null;
  sidebarOpen: boolean;
  visibleSiblingIds: Set<string>;

  setSelectedEvent: (id: string) => void;
  clearSelectedEvent: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSiblingVisibility: (id: string) => void;
  clearVisibleSiblings: () => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  selectedEventId: null,
  sidebarOpen: true,
  visibleSiblingIds: new Set(),

  setSelectedEvent: (id) => set({ selectedEventId: id }),
  clearSelectedEvent: () => set({ selectedEventId: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSiblingVisibility: (id) =>
    set((s) => {
      const next = new Set(s.visibleSiblingIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { visibleSiblingIds: next };
    }),
  clearVisibleSiblings: () => set({ visibleSiblingIds: new Set() }),
}));
