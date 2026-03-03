'use client';

import { create } from 'zustand';

interface TimelineStore {
  selectedEventId: string | null;
  sidebarOpen: boolean;
  hiddenSiblingIds: Set<string>;

  setSelectedEvent: (id: string) => void;
  clearSelectedEvent: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSiblingVisibility: (id: string) => void;
  resetHiddenSiblings: () => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  selectedEventId: null,
  sidebarOpen: true,
  hiddenSiblingIds: new Set(),

  setSelectedEvent: (id) => set((s) => ({ selectedEventId: s.selectedEventId === id ? null : id })),
  clearSelectedEvent: () => set({ selectedEventId: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSiblingVisibility: (id) =>
    set((s) => {
      const next = new Set(s.hiddenSiblingIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { hiddenSiblingIds: next };
    }),
  resetHiddenSiblings: () => set({ hiddenSiblingIds: new Set() }),
}));
