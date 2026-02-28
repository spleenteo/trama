'use client';

import { create } from 'zustand';

interface TimelineStore {
  selectedEventId: string | null;
  sidebarOpen: boolean;

  setSelectedEvent: (id: string) => void;
  clearSelectedEvent: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useTimelineStore = create<TimelineStore>((set) => ({
  selectedEventId: null,
  sidebarOpen: true,

  setSelectedEvent: (id) => set({ selectedEventId: id }),
  clearSelectedEvent: () => set({ selectedEventId: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));
